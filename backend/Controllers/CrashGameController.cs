// CrashGameController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Services;
using backend.Models;
using Microsoft.AspNetCore.Identity;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CrashGameController : ControllerBase
    {
        private readonly ICrashGameService _crashGameService;
        private readonly UserManager<ApplicationUser> _userManager;

        public CrashGameController(
            ICrashGameService crashGameService,
            UserManager<ApplicationUser> userManager)
        {
            _crashGameService = crashGameService;
            _userManager = userManager;
        }

        [HttpGet("state")]
        [AllowAnonymous]
        public async Task<ActionResult<CrashGameUpdate>> GetGameState()
        {
            var gameState = await _crashGameService.GetGameStateAsync();
            return Ok(gameState);
        }

        [HttpPost("bet")]
        [Authorize]
        public async Task<ActionResult> PlaceBet([FromBody] PlaceBetRequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }

            var success = await _crashGameService.PlaceBetAsync(user.Id, user.UserName!, request.BetAmount);

            if (success)
            {
                return Ok(new { success = true, message = "Bet placed successfully" });
            }
            else
            {
                return BadRequest(new { success = false, message = "Unable to place bet" });
            }
        }

        [HttpPost("withdraw")]
        [Authorize]
        public async Task<ActionResult> Withdraw()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }

            var success = await _crashGameService.WithdrawAsync(user.Id);

            if (success)
            {
                return Ok(new { success = true, message = "Withdrawal successful" });
            }
            else
            {
                return BadRequest(new { success = false, message = "Unable to withdraw" });
            }
        }
    }
}