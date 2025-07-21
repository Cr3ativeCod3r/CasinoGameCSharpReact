using Microsoft.AspNetCore.SignalR;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace backend.Hubs
{
    public partial class CrashGameHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private readonly ICrashGameService _crashGameService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<CrashGameHub> _logger;

        public CrashGameHub(
            ApplicationDbContext context,
            ICrashGameService crashGameService,
            UserManager<ApplicationUser> userManager,
            ILogger<CrashGameHub> logger)
        {
            _context = context;
            _crashGameService = crashGameService;
            _userManager = userManager;
            _logger = logger;
        }

        // DODANA METODA GetBalance
        public async Task GetBalance()
        {
            var user = await _userManager.GetUserAsync(Context.User);
            if (user == null)
            {
                await Clients.Caller.SendAsync("Error", "User not found");
                return;
            }

            try
            {
                _logger.LogInformation($"Sending balance to user {user.UserName}: {user.Balance}");
                await Clients.Caller.SendAsync("BalanceUpdate", new { balance = user.Balance });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting balance for user {UserId}", user.Id);
                await Clients.Caller.SendAsync("Error", "Error getting balance");
            }
        }

        public async Task PlaceBet(PlaceBetRequest request)
        {
            var user = await _userManager.GetUserAsync(Context.User);
            if (user == null)
            {
                await Clients.Caller.SendAsync("Error", "User not found");
                return;
            }

            try
            {
                var success = await _crashGameService.PlaceBetAsync(user.Id, user.UserName!, request.BetAmount);

                if (success)
                {
                    await Clients.Caller.SendAsync("BetPlaced", new { success = true, amount = request.BetAmount });
                    // Po pomyślnym postawieniu zakładu, wyślij zaktualizowany balance
                    await GetBalance();
                }
                else
                {
                    await Clients.Caller.SendAsync("BetPlaced", new { success = false, message = "Unable to place bet" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error placing bet for user {UserId}", user.Id);
                await Clients.Caller.SendAsync("Error", "Błąd podczas stawiania zakładu");
            }
        }

        public async Task Withdraw()
        {
            var user = await _userManager.GetUserAsync(Context.User);
            if (user == null)
            {
                await Clients.Caller.SendAsync("Error", "User not found");
                return;
            }

            try
            {
                var success = await _crashGameService.WithdrawAsync(user.Id);

                if (success)
                {
                    await Clients.Caller.SendAsync("WithdrawSuccess", new { success = true });
                    // Po pomyślnej wypłacie, wyślij zaktualizowany balance
                    await GetBalance();
                }
                else
                {
                    await Clients.Caller.SendAsync("WithdrawSuccess", new { success = false, message = "Unable to withdraw" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error withdrawing for user {UserId}", user.Id);
                await Clients.Caller.SendAsync("Error", "Błąd podczas wypłaty");
            }
        }

        public override async Task OnConnectedAsync()
        {
            var user = await _userManager.GetUserAsync(Context.User);
            if (user != null)
            {
                _logger.LogInformation($"Player {user.UserName} connected to crash hub");

                try
                {
                    var gameState = await _crashGameService.GetGameStateAsync();
                    await Clients.Caller.SendAsync("GameUpdate", gameState);
                    await GetBalance();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending game state to user {UserId}", user.Id);
                }
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var user = await _userManager.GetUserAsync(Context.User);
            if (user != null)
            {
                _logger.LogInformation($"Player {user.UserName} disconnected from crash hub");
            }

            if (exception != null)
            {
                _logger.LogError(exception, "User disconnected with error");
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}