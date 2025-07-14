using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    
    public class ChatController : ControllerBase
    {
        private readonly IMessageService _messageService;

        public ChatController(IMessageService messageService)
        {
            _messageService = messageService;
        }

        [HttpGet("messages")]
        
        public async Task<IActionResult> GetRecentMessages([FromQuery] int count = 50)
        {
            try
            {
                var messages = await _messageService.GetRecentMessagesAsync(count);
                return Ok(messages);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Nie udało się pobrać wiadomości" });
            }
        }
    }
}