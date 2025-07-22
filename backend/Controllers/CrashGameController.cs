// CrashGameController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Services;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CrashGameController : ControllerBase
    {
        private readonly ICrashGameService _crashGameService;
        private readonly ILogger<CrashGameController> _logger;

        public CrashGameController(
            ICrashGameService crashGameService,
            ILogger<CrashGameController> logger)
        {
            _crashGameService = crashGameService;
            _logger = logger;
        }

        [HttpGet("state")]
        public async Task<ActionResult<CrashGameUpdate>> GetGameState()
        {
            try
            {
                var gameState = _crashGameService.GetGameState();
                return Ok(gameState);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting game state");
                return StatusCode(500, "An error occurred while retrieving game state");
            }
        }

        [HttpGet("balance/{userId}")]
        public async Task<ActionResult<decimal>> GetBalance(string userId)
        {
            try
            {
                var balance = await _crashGameService.GetUserBalanceAsync(userId);
                return Ok(balance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting balance for user {UserId}", userId);
                return StatusCode(500, "An error occurred while retrieving balance");
            }
        }
    }
}