using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public interface IMessageService
    {
        Task<List<MessageDto>> GetRecentMessagesAsync(int count = 50);
    }

    public class MessageService : IMessageService
    {
        private readonly ApplicationDbContext _context;

        public MessageService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<MessageDto>> GetRecentMessagesAsync(int count = 50)
        {
            return await _context.Messages
                .OrderByDescending(m => m.CreatedAt)
                .Take(count)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    Content = m.Content,
                    UserNick = m.UserNick,
                    UserId = m.UserId,
                    CreatedAt = m.CreatedAt.ToString("HH:mm")
                })
                .ToListAsync();
        }
    }

    public class MessageDto
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string UserNick { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string CreatedAt { get; set; } = string.Empty;
    }
}