using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using backend.Services;
using backend.Models;
using Microsoft.AspNetCore.Identity;

namespace backend.Hubs
{
    [Authorize]
    public class CrashGameHub : Hub
    {
        private readonly ICrashGameService _crashGameService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<CrashGameHub> _logger;

        public CrashGameHub(
            ICrashGameService crashGameService,
            UserManager<ApplicationUser> userManager,
            ILogger<CrashGameHub> logger)
        {
            _crashGameService = crashGameService;
            _userManager = userManager;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var user = await _userManager.GetUserAsync(Context.User);
            if (user != null)
            {
                _logger.LogInformation($"Player {user.UserName} connected to crash game");
                
                // Wyślij aktualny stan gry do nowo połączonego gracza
                var gameState = await _crashGameService.GetGameStateAsync();
                await Clients.Caller.SendAsync("GameUpdate", gameState);
            }
            
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var user = await _userManager.GetUserAsync(Context.User);
            if (user != null)
            {
                _logger.LogInformation($"Player {user.UserName} disconnected from crash game");
            }
            
            await base.OnDisconnectedAsync(exception);
        }

        public async Task PlaceBet(PlaceBetRequest request)
        {
            var user = await _userManager.GetUserAsync(Context.User);
            if (user == null)
            {
                await Clients.Caller.SendAsync("Error", "User not found");
                return;
            }

            var success = await _crashGameService.PlaceBetAsync(user.Id, user.UserName!, request.BetAmount);
            
            if (success)
            {
                await Clients.Caller.SendAsync("BetPlaced", new { success = true, amount = request.BetAmount });
            }
            else
            {
                await Clients.Caller.SendAsync("BetPlaced", new { success = false, message = "Unable to place bet" });
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

            var success = await _crashGameService.WithdrawAsync(user.Id);
            
            if (success)
            {
                await Clients.Caller.SendAsync("WithdrawSuccess", new { success = true });
            }
            else
            {
                await Clients.Caller.SendAsync("WithdrawSuccess", new { success = false, message = "Unable to withdraw" });
            }
        }
    }
}
