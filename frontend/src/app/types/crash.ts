export interface CrashBet {
  playerID: string;
  playerName: string;
  betAmount: number;
  inGame: {
    withdrew: boolean;
    withdrawMultiplier: number;
    withdrawProfit: number;
  };
}

export interface CrashGameUpdate {
  multiplier: number;
  xChart: number;
  yChart: number;
  bets: { [key: string]: CrashBet };
  timeRemaining: number;
  bettingOpen: boolean;
  gameActive: boolean;
}

export interface PlaceBetRequest {
  betAmount: number;
}

export interface BalanceUpdate {
  balance: number;
}

export interface CrashGameState {
  // Game state
  multiplier: number;
  xChart: number;
  yChart: number;
  bets: { [key: string]: CrashBet };
  timeRemaining: number;
  bettingOpen: boolean;
  gameActive: boolean;
  
  // User balance
  balance: number;
  
  // UI state
  betAmount: number;
  autoCashOut: number;
  loading: boolean;
  error: string | null;
  connected: boolean;
  
  // SignalR
  connection: signalR.HubConnection | null;
  url: string;
}

export interface CrashGameActions {
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Balance management
  requestBalance: () => Promise<void>;
  
  // Game actions
  placeBet: () => Promise<void>;
  withdraw: () => Promise<void>;
  
  // Event handlers
  handleGameUpdate: (gameUpdate: CrashGameUpdate) => void;
  handleGameCrashed: () => void;
  handleBetPlaced: (response: { success: boolean; amount?: number; message?: string }) => void;
  handleWithdrawSuccess: (response: { success: boolean; message?: string }) => void;
  handleBalanceUpdate: (balanceUpdate: BalanceUpdate) => void;
  
  // Setters
  setBetAmount: (amount: number) => void;
  setAutoCashOut: (amount: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Auto cash out logic
  checkAutoCashOut: () => void;
}