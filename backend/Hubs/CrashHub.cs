using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace backend.Hubs
{
    public class CrashHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private readonly ICrashGameService _crashGameService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<CrashHub> _logger;

        public CrashHub(
            ApplicationDbContext context,
            ICrashGameService crashGameService,
            UserManager<ApplicationUser> userManager,
            ILogger<CrashHub> logger)
        {
            _context = context;
            _crashGameService = crashGameService;
            _userManager = userManager;
            _logger = logger;
        }

        // Chat functionality
        public async Task SendMessage(string message)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userNick = Context.User?.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(userNick))
            {
                await Clients.Caller.SendAsync("Error", "Nie udało się zidentyfikować użytkownika");
                return;
            }

            if (string.IsNullOrWhiteSpace(message) || message.Length > 500)
            {
                await Clients.Caller.SendAsync("Error", "Wiadomość jest pusta lub za długa");
                return;
            }

            var newMessage = new Message
            {
                Content = message.Trim(),
                UserId = userId,
                UserNick = userNick,
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                _context.Messages.Add(newMessage);
                await _context.SaveChangesAsync();

                // Wyślij wiadomość do wszystkich połączonych klientów
                await Clients.All.SendAsync("ReceiveMessage", new
                {
                    id = newMessage.Id,
                    content = newMessage.Content,
                    userNick = newMessage.UserNick,
                    userId = newMessage.UserId,
                    createdAt = newMessage.CreatedAt.ToString("HH:mm")
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message for user {UserId}", userId);
                await Clients.Caller.SendAsync("Error", "Nie udało się wysłać wiadomości");
            }
        }

        // Crash game functionality
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

                // Wyślij aktualny stan gry do nowo połączonego gracza
                try
                {
                    var gameState = await _crashGameService.GetGameStateAsync();
                    await Clients.Caller.SendAsync("GameUpdate", gameState);
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