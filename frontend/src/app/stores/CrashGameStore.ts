import { create } from 'zustand';
import * as signalR from '@microsoft/signalr';
import {
  CrashBet,
  CrashGameUpdate,
  PlaceBetRequest,
  BalanceUpdate,
  CrashGameState,
  CrashGameActions,
  CrashGamePhase
} from '@/app/types/crash'

type CrashGameStore = CrashGameState & CrashGameActions;

const useCrashGameStore = create<CrashGameStore>((set, get) => ({
  // Initial state
  phase: CrashGamePhase.Betting,
  multiplier: 1.0,
  xChart: 0.0,
  yChart: 0.0,
  bets: {},
  timeRemaining: 10.0,
  bettingOpen: true,
  gameActive: false,
  balance: 0,
  betAmount: 0,
  autoCashOut: 0,
  loading: false,
  error: null,
  connected: false,
  connection: null,
  url: "http://localhost:5000",

  // Connection management
  connect: async () => {
    const state = get();
    if (state.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${state.url}/crashHub`)
        .withAutomaticReconnect()
        .build();

      // Event handlers
      connection.on('GameUpdate', (gameUpdate: CrashGameUpdate) => {
        get().handleGameUpdate(gameUpdate);
      });

      connection.on('GameCrashed', () => {
        get().handleGameCrashed();
      });

      connection.on('BetPlaced', (response: { success: boolean; amount?: number; message?: string }) => {
        get().handleBetPlaced(response);
      });

      connection.on('WithdrawSuccess', (response: { success: boolean; message?: string }) => {
        get().handleWithdrawSuccess(response);
      });

      connection.on('BalanceUpdate', (balanceUpdate: BalanceUpdate) => {
        get().handleBalanceUpdate(balanceUpdate);
      });

      connection.on('Error', (error: string) => {
        get().setError(error);
      });

      await connection.start();
      set({
        connection,
        connected: true,
        error: null
      });

      console.log('Connected to Crash Game Hub');

      // Request initial balance
      await get().requestBalance();
      
      // Set up periodic balance updates every 5 seconds
      setInterval(async () => {
        if (get().connected) {
          await get().requestBalance();
        }
      }, 5000);
    } catch (error) {
      console.error('Connection failed:', error);
      set({
        connected: false,
        error: 'Connection failed'
      });
    }
  },

  disconnect: async () => {
    const { connection } = get();
    if (connection) {
      await connection.stop();
      set({
        connection: null,
        connected: false
      });
    }
  },

  // Balance management
  requestBalance: async () => {
    const { connection } = get();
    if (!connection) {
      console.log('No connection available for balance request');
      return;
    }

    try {
      console.log('Requesting balance from server...');
      await connection.invoke('GetBalance');
    } catch (error) {
      console.error('Failed to request balance:', error);
    }
  },

  // Game actions
  placeBet: async (userId?: string) => {
    const { connection, betAmount } = get();
    const state = get();
    
    if (!connection || !canPlaceBet(state, userId) || betAmount <= 0) {
      return;
    }

    try {
      set({ loading: true, error: null });

      await connection.invoke('PlaceBet', {
        betAmount: betAmount
      } as PlaceBetRequest);
    } catch (error) {
      console.error('Place bet failed:', error);
      set({ error: 'Failed to place bet', loading: false });
    }
  },

  withdraw: async (userId?: string) => {
    const { connection } = get();
    const state = get();
    
    if (!connection || !canWithdraw(state, userId)) {
      return;
    }

    try {
      set({ loading: true, error: null });

      await connection.invoke('Withdraw');
    } catch (error) {
      console.error('Withdraw failed:', error);
      set({ error: 'Failed to withdraw', loading: false });
    }
  },

  // Event handlers
  handleGameUpdate: (gameUpdate: CrashGameUpdate) => {
    // Determine phase based on game state
    let phase: CrashGamePhase;
    if (gameUpdate.bettingOpen && !gameUpdate.gameActive) {
      phase = CrashGamePhase.Betting;
    } else if (!gameUpdate.bettingOpen && gameUpdate.gameActive) {
      phase = CrashGamePhase.Running;
    } else {
      phase = CrashGamePhase.Crashed;
    }

    set({
      phase,
      multiplier: gameUpdate.multiplier,
      xChart: gameUpdate.xChart,
      yChart: gameUpdate.yChart,
      bets: gameUpdate.bets,
      timeRemaining: gameUpdate.timeRemaining,
      bettingOpen: gameUpdate.bettingOpen,
      gameActive: gameUpdate.gameActive
    });
  },

  handleGameCrashed: () => {
    set({ 
      gameActive: false, 
      phase: CrashGamePhase.Crashed 
    });
    console.log('Game crashed at:', get().multiplier.toFixed(2) + 'x');
  },

  handleBetPlaced: (response: { success: boolean; amount?: number; message?: string }) => {
    set({ loading: false });
    if (response.success) {
      set({ error: null });
      // Don't reset betAmount here - let the component handle it
    } else {
      set({ error: response.message || 'Failed to place bet' });
    }
  },

  handleWithdrawSuccess: (response: { success: boolean; message?: string }) => {
    set({ loading: false });
    if (response.success) {
      set({ error: null });
    } else {
      set({ error: response.message || 'Failed to withdraw' });
    }
  },

  handleBalanceUpdate: (balanceUpdate: any) => {
    console.log('Received balance update - RAW:', balanceUpdate);
    console.log('Balance update type:', typeof balanceUpdate);
    console.log('Balance update keys:', Object.keys(balanceUpdate));
    
    // Sprawdź różne możliwe struktury
    let balance = 0;
    if (typeof balanceUpdate === 'number') {
      balance = balanceUpdate;
    } else if (balanceUpdate && typeof balanceUpdate.balance === 'number') {
      balance = balanceUpdate.balance;
    } else if (balanceUpdate && typeof balanceUpdate.Balance === 'number') {
      balance = balanceUpdate.Balance;
    } else {
      console.error('Unknown balance update structure:', balanceUpdate);
      return;
    }
    
    console.log('Setting balance to:', balance);
    set({ balance: balance });
  },

  // Setters
  setBetAmount: (amount: number) => {
    set({ betAmount: amount });
  },

  setAutoCashOut: (amount: number) => {
    set({ autoCashOut: amount });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // Auto cash out logic
  checkAutoCashOut: (userId?: string) => {
    const state = get();
    if (state.autoCashOut > 0 &&
      state.gameActive &&
      state.multiplier >= state.autoCashOut &&
      getCurrentUserBet(state, userId) &&
      canWithdraw(state, userId)) {
      get().withdraw(userId);
    }
  }
}));

// Helper functions - now properly accept userId parameter
export const getCurrentUserBet = (state: CrashGameState, userId?: string): CrashBet | null => {
  if (!userId) return null;
  return state.bets[userId] || null;
};

export const getHasActiveBet = (state: CrashGameState, userId?: string): boolean => {
  return getCurrentUserBet(state, userId) !== null;
};

export const canPlaceBet = (state: CrashGameState, userId?: string): boolean => {
  return state.connected &&
    state.phase === CrashGamePhase.Betting &&
    state.bettingOpen &&
    !getHasActiveBet(state, userId) &&
    state.betAmount > 0 &&
    state.betAmount <= state.balance;
};

export const canWithdraw = (state: CrashGameState, userId?: string): boolean => {
  const currentBet = getCurrentUserBet(state, userId);
  return state.connected &&
    state.phase === CrashGamePhase.Running &&
    state.gameActive &&
    getHasActiveBet(state, userId) &&
    currentBet &&
    !currentBet.inGame?.withdrew;
};

export const getFormattedMultiplier = (state: CrashGameState): string => {
  return state.multiplier.toFixed(2) + 'x';
};

export const getFormattedTimeRemaining = (state: CrashGameState): string => {
  return Math.max(0, state.timeRemaining).toFixed(1) + 's';
};

export const getFormattedBalance = (state: CrashGameState): string => {
  return state.balance.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const getBetsArray = (state: CrashGameState): CrashBet[] => {
  return Object.values(state.bets);
};

export default useCrashGameStore;