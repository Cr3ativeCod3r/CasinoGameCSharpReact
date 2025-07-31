using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Services;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CrashHistoryController : ControllerBase
    {
        private readonly ICrashGameService _crashGameService;
        private readonly ILogger<CrashHistoryController> _logger;

        public CrashHistoryController(
            ICrashGameService crashGameService,
            ILogger<CrashHistoryController> logger)
        {
            _crashGameService = crashGameService;
            _logger = logger;
        }

        [HttpGet]
        [Route("crashedhistory")]
        public async Task<IActionResult> GetCrashHistory([FromQuery] int count = 20)
        {
            try
            {
                if (count < 1) count = 1;
                if (count > 100) count = 100; // Limit max records
                
                var history = await _crashGameService.GetCrashHistoryAsync(count);
                return Ok(new
                {
                    success = true,
                    data = history,
                    count = history.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving crash history");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving crash history"
                });
            }
        }

        [HttpGet]
        [Route("crashedhistory/{id}")]
        [Authorize]
        public async Task<IActionResult> GetCrashHistoryById(int id)
        {
            try
            {
                var history = await _crashGameService.GetCrashHistoryAsync(100);
                var item = history.FirstOrDefault(h => h.Id == id);
                
                if (item == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Crash history not found"
                    });
                }
                
                return Ok(new
                {
                    success = true,
                    data = item
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving crash history by ID");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving crash history"
                });
            }
        }
    }
}
