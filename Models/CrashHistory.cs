using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class CrashHistory
    {
        [Key]
        public int Id { get; set; }
        
        public DateTime CrashedAt { get; set; }
        
        public double CrashPoint { get; set; }
        
        public int TotalBets { get; set; }
        
        public decimal TotalBetAmount { get; set; }
        
        public int TotalWithdrawals { get; set; }
        
        public decimal TotalProfit { get; set; }
        
        public string BetsJson { get; set; } = string.Empty;
    }
    
    public class CrashHistoryDto
    {
        public int Id { get; set; }
        public DateTime CrashedAt { get; set; }
        public double CrashPoint { get; set; }
        public int TotalBets { get; set; }
        public decimal TotalBetAmount { get; set; }
        public int TotalWithdrawals { get; set; }
        public decimal TotalProfit { get; set; }
        public List<CrashBetHistoryDto> Bets { get; set; } = new();
    }

    public class CrashBetHistoryDto
    {
        public string PlayerName { get; set; } = string.Empty;
        public decimal BetAmount { get; set; }
        public bool Withdrew { get; set; }
        public double WithdrawMultiplier { get; set; }
        public double WithdrawProfit { get; set; }
        public string PlayerId { get; set; }
        
    }
}
