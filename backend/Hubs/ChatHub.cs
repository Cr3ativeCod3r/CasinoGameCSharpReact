using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Hubs
{

    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;

        public ChatHub(ApplicationDbContext context)
        {
            _context = context;
        }

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
                await Clients.Caller.SendAsync("Error", "Nie udało się wysłać wiadomości");
            }
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
}