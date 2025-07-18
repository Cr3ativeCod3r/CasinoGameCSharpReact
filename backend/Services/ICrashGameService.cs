using backend.Models;

namespace backend.Services
{
    public interface ICrashGameService
    {
        Task<bool> PlaceBetAsync(string playerID, string playerName, decimal betAmount);
        Task<bool> WithdrawAsync(string playerID);
        Task<CrashGameUpdate> GetGameStateAsync();
        Task StartGameLoopAsync();
        void StartBettingTimer();
        void StartGameIfNotStarted();
        event Func<CrashGameUpdate, Task> OnGameUpdate;
        event Func<Task> OnGameCrashed;
    }
}