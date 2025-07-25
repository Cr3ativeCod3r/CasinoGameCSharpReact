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
  phase: CrashGamePhase;
  multiplier: number;
  xChart: number;
  yChart: number;
  bets: { [key: string]: CrashBet };
  timeRemaining: number;
  bettingOpen: boolean;
  gameActive: boolean;
  balance: number;
  betAmount: number;
  autoCashOut: number;
  loading: boolean;
  error: string | null;
  connected: boolean;
  connection: signalR.HubConnection | null;
  url: string;
}

export interface CrashGameActions {
  setupListeners: () => void;
  removeListeners: () => void;
  requestBalance: () => Promise<void>;
  placeBet: (userId?: string) => Promise<void>;
  withdraw: (userId?: string) => Promise<void>;
  handleGameUpdate: (gameUpdate: CrashGameUpdate) => void;
  handleGameCrashed: () => void;
  handleBetPlaced: (response: { success: boolean; amount?: number; message?: string }) => void;
  handleWithdrawSuccess: (response: { success: boolean; message?: string }) => void;
  handleBalanceUpdate: (balanceUpdate: any) => void;
  setBetAmount: (amount: number) => void;
  setAutoCashOut: (amount: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  checkAutoCashOut: (userId?: string) => void;
}

export enum CrashGamePhase {
  Betting = 'Betting',
  Running = 'Running',
  Crashed = 'Crashed'
}
