using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class CrashBet
    {
        public string PlayerID { get; set; } = string.Empty;
        public string PlayerName { get; set; } = string.Empty;
        public decimal BetAmount { get; set; }
        public CrashInGameData InGame { get; set; } = new();
    }

    public class CrashInGameData
    {
        public bool Withdrew { get; set; } = false;
        public double WithdrawMultiplier { get; set; } = 0.0;
        public double WithdrawProfit { get; set; } = 0.0;
    }

    public class CrashGameState
    {
        public double TargetCrash { get; set; }
        public double Multiplier { get; set; } = 1.00;
        public double XChart { get; set; } = 0.0;
        public double YChart { get; set; } = 0.0;
        public bool Active { get; set; } = true;
    }

    public class CrashTimer
    {
        public double TimeRemaining { get; set; }
        
        public CrashTimer(double time)
        {
            TimeRemaining = time;
        }
        
        public string Countdown()
        {
            TimeRemaining -= 0.01;
            if (TimeRemaining <= 0)
            {
                TimeRemaining = 0;
                return "done";
            }
            return "running";
        }
    }

    public class PlaceBetRequest
    {
        [Required]
        public decimal BetAmount { get; set; }
    }

    public class CrashGameUpdate
    {
        public double Multiplier { get; set; }
        public double XChart { get; set; }
        public double YChart { get; set; }
        public Dictionary<string, CrashBet> Bets { get; set; } = new();
        public double TimeRemaining { get; set; }
        public bool BettingOpen { get; set; }
        public bool GameActive { get; set; }
    }
}