// CrashGameService.cs
using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using backend.Hubs;
using Microsoft.Extensions.DependencyInjection;
using backend.Utils;

namespace backend.Services
{
    public class CrashGameService : ICrashGameService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<CrashGameService> _logger;
        private readonly IHubContext<CrashGameHub>? _hubContext;
        private bool _bettingOpen = true;
        private const double INITIAL_TIME = 10.0;
        private CrashTimer _timer;
        private CrashGameState? _game;
        private Dictionary<string, CrashBet> _bets = new();
        private System.Timers.Timer? _bettingTimer;
        private System.Timers.Timer? _gameTimer;
        private readonly Random _random = new();
        private readonly object _lock = new();
        private bool _gameStarted = false;

        public event Func<CrashGameUpdate, Task> OnGameUpdate = delegate { return Task.CompletedTask; };
        public event Func<Task> OnGameCrashed = delegate { return Task.CompletedTask; };
        public event Func<string, decimal, Task> OnBalanceUpdate = delegate { return Task.CompletedTask; };

        public CrashGameService(
            IServiceScopeFactory scopeFactory,
            ILogger<CrashGameService> logger,
            IHubContext<CrashGameHub>? hubContext = null)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _hubContext = hubContext;
            _timer = new CrashTimer(INITIAL_TIME);

            if (_hubContext != null)
            {
                ConnectSignalREvents();
            }
        }

        private void ConnectSignalREvents()
        {
            if (_hubContext == null) return;

            OnGameUpdate += async (gameUpdate) =>
            {
                try
                {
                    await _hubContext.Clients.All.SendAsync("GameUpdate", gameUpdate);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending GameUpdate to clients");
                }
            };

            OnGameCrashed += async () =>
            {
                try
                {
                    await _hubContext.Clients.All.SendAsync("GameCrashed");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending GameCrashed to clients");
                }
            };

            OnBalanceUpdate += async (userId, balance) =>
            {
                try
                {
                    var balanceData = new
                    {
                        balance = (double)balance,
                        userId = userId
                    };

                    await _hubContext.Clients.User(userId).SendAsync("BalanceUpdate", balanceData);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending BalanceUpdate to user {UserId}", userId);
                }
            };

            _logger.LogInformation("SignalR events connected to CrashGameService");
        }
        public void StartGameIfNotStarted()
        {
            lock (_lock)
            {
                if (!_gameStarted)
                {
                    _gameStarted = true;
                    _logger.LogInformation("Starting crash game service for the first time");
                    StartBettingTimer();
                }
            }
        }

        public void StartBettingTimer()
        {
            _bettingTimer?.Dispose();
            _bettingTimer = new System.Timers.Timer(10);
            _bettingTimer.Elapsed += async (sender, e) =>
            {
                bool shouldStartGame = false;

                lock (_lock)
                {
                    if (_bettingOpen && _timer.Countdown() == "done")
                    {
                        _bettingOpen = false;
                        shouldStartGame = true;
                        _bettingTimer?.Stop();
                    }
                }

                if (shouldStartGame && _game == null)
                {
                    StartGameLoop();
                }
                try
                {
                    await OnGameUpdate(GetGameState());
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending game update during betting phase");
                }
            };
            _bettingTimer.Start();
            _logger.LogInformation("Betting timer started");
        }

        public async Task<bool> PlaceBetAsync(string playerID, string playerName, decimal betAmount)
        {
            if (string.IsNullOrEmpty(playerID) || string.IsNullOrEmpty(playerName) || betAmount <= 0)
            {
                return false;
            }

            lock (_lock)
            {
                if (!_bettingOpen || _bets.ContainsKey(playerID) || _timer.TimeRemaining <= 0)
                {
                    _logger.LogWarning($"Cannot place bet for {playerName}: bettingOpen={_bettingOpen}, hasExistingBet={_bets.ContainsKey(playerID)}, timeRemaining={_timer.TimeRemaining}");
                    return false;
                }
            }

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

                var user = await userManager.FindByIdAsync(playerID);
                if (user == null)
                {
                    _logger.LogWarning($"User not found: {playerID}");
                    return false;
                }

                if (user.Balance < betAmount)
                {
                    _logger.LogWarning($"Insufficient balance for {playerName}: has {user.Balance}, needs {betAmount}");
                    return false;
                }

                user.Balance -= betAmount;
                await userManager.UpdateAsync(user);

                lock (_lock)
                {
                    _bets[playerID] = new CrashBet
                    {
                        PlayerID = playerID,
                        PlayerName = playerName,
                        BetAmount = betAmount,
                        InGame = new CrashInGameData()
                    };
                }

                _logger.LogInformation($"Bet placed - PlayerID: {playerID}, PlayerName: {playerName}, BetAmount: {betAmount}");

                await OnBalanceUpdate(playerID, user.Balance);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error placing bet for player {PlayerName}", playerName);
                return false;
            }
        }

        public async Task<bool> WithdrawAsync(string playerID)
        {

            if (string.IsNullOrEmpty(playerID))
            {
                _logger.LogWarning("WithdrawAsync called with empty playerID");
                return false;
            }

            CrashBet? bet;
            double currentMultiplier;
            bool gameActive;

            lock (_lock)
            {
                if (!_bets.TryGetValue(playerID, out bet) ||
                    bet.InGame.Withdrew ||
                    _game == null ||
                    !_game.Active)
                {
                    return false;
                }

                currentMultiplier = _game.Multiplier;
                gameActive = _game.Active;
            }

            if (!gameActive)
            {
                return false;
            }

            try
            {
                var betAmount = bet.BetAmount;
                var profit = (double)betAmount * currentMultiplier;

                lock (_lock)
                {
                    bet.InGame.Withdrew = true;
                    bet.InGame.WithdrawMultiplier = currentMultiplier;
                    bet.InGame.WithdrawProfit = profit;
                }
                using var scope = _scopeFactory.CreateScope();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

                var user = await userManager.FindByIdAsync(playerID);
                if (user != null)
                {
                    user.Balance += (decimal)profit;
                    await userManager.UpdateAsync(user);
                    await OnBalanceUpdate(playerID, user.Balance);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing withdrawal for player {PlayerID}", playerID);
                return false;
            }
        }

        public async Task<decimal> GetUserBalanceAsync(string playerID)
        {
            if (string.IsNullOrEmpty(playerID))
                return 0m;

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

                var user = await userManager.FindByIdAsync(playerID);
                var balance = user?.Balance ?? 0m;
                _logger.LogInformation($"GetUserBalanceAsync for {playerID}: {balance}");
                return balance;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting balance for player {PlayerID}", playerID);
                return 0m;
            }
        }

        public void StartGameLoop()
        {
            string serverSeed = "secret";
            string gameId = Guid.NewGuid().ToString();

            double targetCrash = CrashPointCalculator.GetCrashPoint(serverSeed, gameId);

            lock (_lock)
            {
                _game = new CrashGameState
                {
                    TargetCrash = targetCrash,
                    Multiplier = 1.00,
                    XChart = 0.0,
                    YChart = 0.0,
                    Active = true
                };
            }

            _gameTimer?.Dispose();
            _gameTimer = new System.Timers.Timer(100);
            _gameTimer.AutoReset = false;
            _gameTimer.Elapsed += async (sender, e) =>
            {
                bool shouldCrash = false;
                double currentMultiplier = 0.0;

                lock (_lock)
                {
                    if (_game != null && _game.Active && _game.Multiplier < _game.TargetCrash)
                    {
                        _game.Multiplier += 0.01;
                        _game.XChart += 0.05;
                        _game.YChart += 0.1;
                        currentMultiplier = _game.Multiplier;

                        if (_game.Multiplier >= _game.TargetCrash)
                        {
                            shouldCrash = true;
                        }
                    }
                }

                if (shouldCrash)
                {
                    await CrashAsync();
                }
                else
                {
                    try
                    {
                        await OnGameUpdate(GetGameState());
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error sending game update during game loop");
                    }

                    double newInterval = 50 - (Math.Floor(currentMultiplier) * 5);
                    if (newInterval < 10) newInterval = 10;

                    _gameTimer.Interval = newInterval;
                    _gameTimer.Start();
                }
            };
            _gameTimer.Start();
            _logger.LogInformation("Game loop started");
        }

        private async Task CrashAsync()
        {
            _gameTimer?.Stop();

            CrashGameState? gameCopy;
            Dictionary<string, CrashBet> betsCopy;

            lock (_lock)
            {
                if (_game != null)
                {
                    _game.Active = false;
                }
                gameCopy = _game;
                betsCopy = new Dictionary<string, CrashBet>(_bets);
            }

            _logger.LogInformation("Game crashed!");

            if (gameCopy != null)
            {
                await SaveCrashHistoryAsync(gameCopy, betsCopy);
            }

            try
            {
                await OnGameCrashed();
                await OnGameUpdate(GetGameState());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending crash notifications");
            }

            await Task.Delay(5000);
            await ResetGameAsync();
        }

        private async Task ResetGameAsync()
        {
            _logger.LogInformation("Resetting game...");

            lock (_lock)
            {
                _bettingOpen = true;
                _timer = new CrashTimer(INITIAL_TIME);
                _bets.Clear();
                _game = null;
            }

            _logger.LogInformation("Game reset - new betting round started");
            StartBettingTimer();

            try
            {
                await OnGameUpdate(GetGameState());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending game reset update");
            }
        }

        public CrashGameUpdate GetGameState()
        {
            Dictionary<string, CrashBet> betsCopy;
            CrashGameState? gameCopy;
            bool bettingOpen;
            double timeRemaining;

            lock (_lock)
            {
                betsCopy = new Dictionary<string, CrashBet>(_bets);
                gameCopy = _game;
                bettingOpen = _bettingOpen;
                timeRemaining = Math.Max(0, _timer.TimeRemaining);
            }

            var gameUpdate = new CrashGameUpdate
            {
                Multiplier = gameCopy?.Multiplier ?? 1.0,
                XChart = gameCopy?.XChart ?? 0.0,
                YChart = gameCopy?.YChart ?? 0.0,
                Bets = betsCopy,
                TimeRemaining = timeRemaining,
                BettingOpen = bettingOpen,
                GameActive = gameCopy?.Active ?? false
            };

            _logger.LogDebug($"Game state - Bets count: {betsCopy.Count}, BettingOpen: {bettingOpen}, GameActive: {gameUpdate.GameActive}");

            return gameUpdate;
        }

        public void Dispose()
        {
            _logger.LogInformation("Disposing CrashGameService...");
            _bettingTimer?.Dispose();
            _gameTimer?.Dispose();
        }




        private async Task SaveCrashHistoryAsync(CrashGameState game, Dictionary<string, CrashBet> bets)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var totalBetAmount = bets.Values.Sum(b => b.BetAmount);
                var totalWithdrawals = bets.Values.Count(b => b.InGame.Withdrew);
                var totalProfit = bets.Values
                    .Where(b => b.InGame.Withdrew)
                    .Sum(b => (decimal)b.InGame.WithdrawProfit);

                var betHistoryList = bets.Values.Select(b => new CrashBetHistoryDto
                {
                    PlayerName = b.PlayerName,
                    BetAmount = b.BetAmount,
                    Withdrew = b.InGame.Withdrew,
                    WithdrawMultiplier = b.InGame.WithdrawMultiplier,
                    WithdrawProfit = b.InGame.WithdrawProfit
                }).ToList();

                var crashHistory = new CrashHistory
                {
                    CrashedAt = DateTime.UtcNow,
                    CrashPoint = game.TargetCrash,
                    TotalBets = bets.Count,
                    TotalBetAmount = totalBetAmount,
                    TotalWithdrawals = totalWithdrawals,
                    TotalProfit = totalProfit,
                    BetsJson = System.Text.Json.JsonSerializer.Serialize(betHistoryList)
                };

                dbContext.CrashHistories.Add(crashHistory);
                await dbContext.SaveChangesAsync();

                _logger.LogInformation($"Crash history saved - CrashPoint: {game.TargetCrash}, TotalBets: {bets.Count}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving crash history");
            }
        }


        public async Task<List<CrashHistoryDto>> GetCrashHistoryAsync(int count = 20)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var histories = await dbContext.CrashHistories
                    .OrderByDescending(ch => ch.CrashedAt)
                    .Take(count)
                    .ToListAsync();

                var historyDtos = histories.Select(h => new CrashHistoryDto
                {
                    Id = h.Id,
                    CrashedAt = h.CrashedAt,
                    CrashPoint = h.CrashPoint,
                    TotalBets = h.TotalBets,
                    TotalBetAmount = h.TotalBetAmount,
                    TotalWithdrawals = h.TotalWithdrawals,
                    TotalProfit = h.TotalProfit,
                    Bets = string.IsNullOrEmpty(h.BetsJson)
                        ? new List<CrashBetHistoryDto>()
                        : System.Text.Json.JsonSerializer.Deserialize<List<CrashBetHistoryDto>>(h.BetsJson) ?? new List<CrashBetHistoryDto>()
                }).ToList();

                return historyDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving crash history");
                return new List<CrashHistoryDto>();
            }
        }

    }
}