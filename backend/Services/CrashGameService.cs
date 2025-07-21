// CrashGameService.cs
using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using backend.Hubs;

namespace backend.Services
{
    public class CrashGameService : ICrashGameService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<CrashGameService> _logger;
        private readonly IHubContext<CrashGameHub>? _hubContext;
        
        // Globalne zmienne
        private bool _bettingOpen = true;
        private const double INITIAL_TIME = 10.0;
        private CrashTimer _timer;
        private CrashGameState? _game;
        private Dictionary<string, CrashBet> _bets = new();
        private System.Timers.Timer? _bettingTimer;
        private System.Timers.Timer? _gameTimer;
        private readonly Random _random = new();
        private readonly object _lock = new();
        
        // Flaga do sprawdzenia czy gra została już uruchomiona
        private bool _gameStarted = false;

        public event Func<CrashGameUpdate, Task> OnGameUpdate = delegate { return Task.CompletedTask; };
        public event Func<Task> OnGameCrashed = delegate { return Task.CompletedTask; };
        public event Func<string, decimal, Task> OnBalanceUpdate = delegate { return Task.CompletedTask; };

        public CrashGameService(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<CrashGameService> logger,
            IHubContext<CrashGameHub>? hubContext = null)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
            _hubContext = hubContext;
            _timer = new CrashTimer(INITIAL_TIME);
            
            // Jeśli mamy HubContext, podłącz eventy bezpośrednio
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
                    _logger.LogDebug("Sending GameUpdate to all clients");
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
                    _logger.LogDebug("Sending GameCrashed to all clients");
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
                        Balance = (double)balance,
                        userId = userId
                    };
                    
                    _logger.LogInformation($"Sending balance update to user {userId}: {balance}");
                    await _hubContext.Clients.User(userId).SendAsync("BalanceUpdate", balanceData);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending BalanceUpdate to user {UserId}", userId);
                }
            };

            _logger.LogInformation("SignalR events connected to CrashGameService");
        }

        // Publiczna metoda do uruchomienia gry (wywoływana tylko raz)
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

        // Change to public to match interface
        public void StartBettingTimer()
        {
            _bettingTimer?.Dispose();
            _bettingTimer = new System.Timers.Timer(10); // 10ms = 0.01s
            _bettingTimer.Elapsed += async (sender, e) =>
            {
                lock (_lock)
                {
                    if (_timer.Countdown() == "done" && _bettingOpen)
                    {
                        _bettingOpen = false;
                        _bettingTimer?.Stop();
                    }
                }

                if (!_bettingOpen && _game == null)
                {
                    await StartGameLoopAsync();
                }

                // Wyślij aktualizację do klientów
                await OnGameUpdate(await GetGameStateAsync());
            };
            _bettingTimer.Start();
        }

        public async Task<bool> PlaceBetAsync(string playerID, string playerName, decimal betAmount)
        {
            lock (_lock)
            {
                if (!_bettingOpen || _bets.ContainsKey(playerID) || _timer.TimeRemaining <= 0)
                {
                    _logger.LogWarning($"Cannot place bet for {playerName}: bettingOpen={_bettingOpen}, hasExistingBet={_bets.ContainsKey(playerID)}, timeRemaining={_timer.TimeRemaining}");
                    return false;
                }
            }

            // Sprawdź saldo gracza
            var user = await _userManager.FindByIdAsync(playerID);
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

            // Odejmij kwotę od salda
            user.Balance -= betAmount;
            await _userManager.UpdateAsync(user);

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

            _logger.LogInformation($"Player {playerName} placed bet: {betAmount}, new balance: {user.Balance}");
            
            // Wyślij balance update
            await OnBalanceUpdate(playerID, user.Balance);
            
            return true;
        }

        public async Task<bool> WithdrawAsync(string playerID)
        {
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
                return false;

            var betAmount = bet.BetAmount;
            var profit = (double)betAmount * currentMultiplier;

            lock (_lock)
            {
                bet.InGame.Withdrew = true;
                bet.InGame.WithdrawMultiplier = currentMultiplier;
                bet.InGame.WithdrawProfit = profit;
            }

            // Dodaj zysk do salda gracza
            var user = await _userManager.FindByIdAsync(playerID);
            if (user != null)
            {
                user.Balance += (decimal)profit;
                await _userManager.UpdateAsync(user);
                
                _logger.LogInformation($"Player {bet.PlayerName} withdrew at {currentMultiplier:F2}x for profit: {profit:F2}, new balance: {user.Balance}");
                
                // Wyślij balance update
                await OnBalanceUpdate(playerID, user.Balance);
            }

            return true;
        }

        public async Task<decimal> GetUserBalanceAsync(string playerID)
        {
            var user = await _userManager.FindByIdAsync(playerID);
            return user?.Balance ?? 0m;
        }

        // Change to public to match interface
        public async Task StartGameLoopAsync()
        {
            var targetCrash = _random.NextDouble() * (10.0 - 1.5) + 1.5;
            
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

            _logger.LogInformation($"Game started with target crash: {targetCrash:F2}x");

            _gameTimer?.Dispose();
            _gameTimer = new System.Timers.Timer(10); // 10ms = 0.01s
            _gameTimer.Elapsed += async (sender, e) =>
            {
                bool shouldCrash = false;
                
                lock (_lock)
                {
                    if (_game != null && _game.Active && _game.Multiplier < _game.TargetCrash)
                    {
                        _game.Multiplier += 0.01;
                        _game.XChart += 0.01;
                        _game.YChart += 0.01;
                        
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
                    await OnGameUpdate(await GetGameStateAsync());
                }
            };
            _gameTimer.Start();
        }

        private async Task CrashAsync()
        {
            _gameTimer?.Stop();
            
            lock (_lock)
            {
                if (_game != null)
                {
                    _game.Active = false;
                }
            }

            _logger.LogInformation("Game crashed!");
            await OnGameCrashed();
            
            // Wyślij informację o crashu
            await OnGameUpdate(await GetGameStateAsync());
            
            // Reset gry po krótkim opóźnieniu
            await Task.Delay(3000);
            await ResetGameAsync();
        }

        private async Task ResetGameAsync()
        {
            lock (_lock)
            {
                _bettingOpen = true;
                _timer = new CrashTimer(INITIAL_TIME);
                _bets.Clear();
                _game = null;
            }

            _logger.LogInformation("Game reset - new betting round started");
            StartBettingTimer();
        }

        public async Task<CrashGameUpdate> GetGameStateAsync()
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
                timeRemaining = _timer.TimeRemaining;
            }

            return new CrashGameUpdate
            {
                Multiplier = gameCopy?.Multiplier ?? 1.0,
                XChart = gameCopy?.XChart ?? 0.0,
                YChart = gameCopy?.YChart ?? 0.0,
                Bets = betsCopy,
                TimeRemaining = timeRemaining,
                BettingOpen = bettingOpen,
                GameActive = gameCopy?.Active ?? false
            };
        }

        // Metoda do czyszczenia zasobów
        public void Dispose()
        {
            _bettingTimer?.Dispose();
            _gameTimer?.Dispose();
        }
    }
}