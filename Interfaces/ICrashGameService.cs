// ICrashGameService.cs
using backend.Models;

namespace backend.Services
{
    public interface ICrashGameService : IDisposable
    {
        // Events
        event Func<CrashGameUpdate, Task> OnGameUpdate;
        event Func<Task> OnGameCrashed;
        event Func<string, decimal, Task> OnBalanceUpdate;

        // Game control methods
        void StartGameIfNotStarted();
        void StartBettingTimer();
        void StartGameLoop();

        // Player actions
        Task<bool> PlaceBetAsync(string playerID, string playerName, decimal betAmount);
        Task<bool> WithdrawAsync(string playerID);
        Task<decimal> GetUserBalanceAsync(string playerID);

        // Game state
        CrashGameUpdate GetGameState();
        Task<List<CrashHistoryDto>> GetCrashHistoryAsync(int count = 20);
        
    }
}