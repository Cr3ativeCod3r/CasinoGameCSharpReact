import { create } from 'zustand';
import * as signalR from '@microsoft/signalr';
import authStore from './AuthStore';
import {
  CrashBet,
  CrashGameUpdate,
  PlaceBetRequest,
  BalanceUpdate,
  CrashGameState,
  CrashGameActions
} from '@/app/types/crash'


type CrashGameStore = CrashGameState & CrashGameActions;

const useCrashGameStore = create<CrashGameStore>((set, get) => ({
  // Initial state
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
    if (!connection) return;

    try {
      await connection.invoke('GetBalance');
    } catch (error) {
      console.error('Failed to request balance:', error);
    }
  },

  // Game actions
  placeBet: async () => {
    const { connection, bettingOpen, betAmount } = get();
    if (!connection || !bettingOpen || betAmount <= 0) {
      return;
    }

    try {
      get().setLoading(true);
      get().setError(null);

      await connection.invoke('PlaceBet', {
        betAmount: betAmount
      } as PlaceBetRequest);
    } catch (error) {
      console.error('Place bet failed:', error);
      get().setError('Failed to place bet');
      get().setLoading(false);
    }
  },

  withdraw: async () => {
    const { connection, gameActive } = get();
    if (!connection || !gameActive) {
      return;
    }

    try {
      get().setLoading(true);
      get().setError(null);

      await connection.invoke('Withdraw');
    } catch (error) {
      console.error('Withdraw failed:', error);
      get().setError('Failed to withdraw');
      get().setLoading(false);
    }
  },

  // Event handlers
  handleGameUpdate: (gameUpdate: CrashGameUpdate) => {
    set({
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
    set({ gameActive: false });
    console.log('Game crashed at:', get().multiplier.toFixed(2) + 'x');
  },

  handleBetPlaced: (response: { success: boolean; amount?: number; message?: string }) => {
    set({ loading: false });
    if (response.success) {
      set({
        error: null,
        betAmount: 0 // Reset bet amount after successful bet
      });
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

  handleBalanceUpdate: (balanceUpdate: BalanceUpdate) => {
    set({ balance: balanceUpdate.balance });
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
  checkAutoCashOut: () => {
    const state = get();
    if (state.autoCashOut > 0 &&
      state.gameActive &&
      state.multiplier >= state.autoCashOut &&
      getCurrentUserBet(state) &&
      canWithdraw(state)) {
      get().withdraw();
    }
  }
}));

// Helper functions for computed values (since Zustand doesn't have getters)
export const getCurrentUserBet = (state: CrashGameState): CrashBet | null => {
  if (!authStore.user) return null;
  return state.bets[authStore.user.id] || null;
};

export const getHasActiveBet = (state: CrashGameState): boolean => {
  return getCurrentUserBet(state) !== null;
};

export const canPlaceBet = (state: CrashGameState): boolean => {
  return state.connected &&
    state.bettingOpen &&
    !getHasActiveBet(state) &&
    state.betAmount > 0 &&
    state.betAmount <= state.balance;
};

export const canWithdraw = (state: CrashGameState): boolean => {
  const currentBet = getCurrentUserBet(state);
  return state.connected &&
    state.gameActive &&
    getHasActiveBet(state) &&
    !currentBet?.inGame.withdrew;
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