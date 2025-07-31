// CrashGameHub.Game.cs
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using backend.Services;
using backend.Models;


namespace backend.Hubs
{
    public partial class CrashGameHub
    {
        [Authorize]
        public async Task PlaceBet(PlaceBetRequest request)
        {
     
            
            try
            {
                var userId = Context.UserIdentifier;
                if (string.IsNullOrEmpty(userId))
                {
           
                    await Clients.Caller.SendAsync("BetPlaced", new 
                    { 
                        success = false, 
                        message = "User not authenticated" 
                    });
                    return;
                }
                var user = await _userManager.GetUserAsync(Context.User!);
                if (user == null)
                {
                    await Clients.Caller.SendAsync("BetPlaced", new 
                    { 
                        success = false, 
                        message = "User not found" 
                    });
                    return;
                }
                var success = await _crashGameService.PlaceBetAsync(userId, user.NickName ?? user.Email ?? "Unknown", request.BetAmount);
                
                await Clients.Caller.SendAsync("BetPlaced", new 
                { 
                    success = success,
                    amount = request.BetAmount,
                    message = success ? "Bet placed successfully" : "Failed to place bet"
                });
            }
            catch (Exception ex)
            {

                await Clients.Caller.SendAsync("BetPlaced", new 
                { 
                    success = false, 
                    message = "An error occurred while placing bet" 
                });
            }
        }

        [Authorize]
        public async Task Withdraw()
        {
            try
            {
                var userId = Context.UserIdentifier;
                if (string.IsNullOrEmpty(userId))
                {
 
                    await Clients.Caller.SendAsync("WithdrawSuccess", new 
                    { 
                        success = false, 
                        message = "User not authenticated" 
                    });
                    return;
                }
                var user = await _userManager.GetUserAsync(Context.User!);
                if (user == null)
                {
                    await Clients.Caller.SendAsync("WithdrawSuccess", new 
                    { 
                        success = false, 
                        message = "User not found" 
                    });
                    return;
                }
                var success = await _crashGameService.WithdrawAsync(userId);
                
                await Clients.Caller.SendAsync("WithdrawSuccess", new 
                { 
                    success = success,
                    message = success ? "Withdrawal successful" : "Failed to withdraw"
                });
            }
            catch (Exception ex)
            {

                await Clients.Caller.SendAsync("WithdrawSuccess", new 
                { 
                    success = false, 
                    message = "An error occurred while withdrawing" 
                });
            }
        }

        [Authorize]
        public async Task GetBalance()
        {
            _logger.LogInformation("GetBalance called");
            
            try
            {
                var user = await _userManager.GetUserAsync(Context.User!);
                if (user != null)
                {
                    _logger.LogInformation($"Sending balance to user {user.Email}: {user.Balance}");
                    await Clients.Caller.SendAsync("BalanceUpdate", new { balance = (double)user.Balance });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetBalance");
            }
        }
        public async Task GetGameState()
        {
            try
            {
                var gameState = _crashGameService.GetGameState();
                await Clients.Caller.SendAsync("GameUpdate", gameState);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetGameState");
            }
        }

        public override async Task OnConnectedAsync()
        {
            var user = await _userManager.GetUserAsync(Context.User!);
            if (user != null)
            {
                _logger.LogInformation($"Player {user.Email} connected to crash hub");
                
                try
                {
                    var gameState = _crashGameService.GetGameState();
                    await Clients.Caller.SendAsync("GameUpdate", gameState);
                    await Clients.Caller.SendAsync("BalanceUpdate", new { balance = (double)user.Balance });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending initial data to connected user");
                }
            }
            
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var user = await _userManager.GetUserAsync(Context.User!);
            if (user != null)
            {
                _logger.LogInformation($"Player {user.Email} disconnected from crash hub");
            }
            
            if (exception != null)
            {
                _logger.LogError(exception, "User disconnected with error");
            }
            
            await base.OnDisconnectedAsync(exception);
        }
    }
}