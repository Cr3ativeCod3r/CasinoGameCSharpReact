using backend.Models;

public interface ICrashGameService
{
    event Func<CrashGameUpdate, Task> OnGameUpdate;
    event Func<Task> OnGameCrashed;
    event Func<string, decimal, Task> OnBalanceUpdate; // DODANE

    void StartGameIfNotStarted();
    void StartBettingTimer();
    Task StartGameLoopAsync();
    Task<bool> PlaceBetAsync(string playerID, string playerName, decimal betAmount);
    Task<bool> WithdrawAsync(string playerID);
    Task<decimal> GetUserBalanceAsync(string playerID); // DODANE
    Task<CrashGameUpdate> GetGameStateAsync();
    void Dispose();
}