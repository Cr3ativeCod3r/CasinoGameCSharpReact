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
import useAuthStore from './AuthStore';

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
    
    // Jeśli już połączony, nie rób nic
    if (state.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('Already connected to SignalR');
      return;
    }

    // Zamknij istniejące połączenie jeśli jest
    if (state.connection) {
      try {
        await state.connection.stop();
      } catch (e) {
        console.log('Error stopping existing connection:', e);
      }
    }

    try {
      // Pobierz token z AuthStore
      const authStore = useAuthStore.getState();
      const token = authStore.token;
      
      if (!token) {
        console.error('No authentication token available');
        set({ error: 'No authentication token', connected: false });
        return;
      }

      console.log('Creating new SignalR connection...');

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${state.url}/crashHub`, {
          accessTokenFactory: () => token,
          // Dodajemy dodatkowe opcje dla stabilności
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            if (retryContext.previousRetryCount === 0) {
              return 0;
            }
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Connection state handlers
      connection.onclose((error) => {
        console.log('SignalR connection closed:', error);
        set({ connected: false });
        if (error) {
          set({ error: `Connection closed: ${error.message}` });
        }
      });

      connection.onreconnecting((error) => {
        console.log('SignalR reconnecting:', error);
        set({ connected: false, error: 'Reconnecting...' });
      });

      connection.onreconnected((connectionId) => {
        console.log('SignalR reconnected:', connectionId);
        set({ connected: true, error: null });
        // Pobierz balance po reconnect
        setTimeout(() => get().requestBalance(), 1000);
      });

      // Event handlers - używamy małych liter zgodnie z tym co wysyła serwer
      connection.on('gameupdate', (gameUpdate: CrashGameUpdate) => {
        console.log('Received gameupdate:', gameUpdate);
        get().handleGameUpdate(gameUpdate);
      });

      connection.on('gamecrashed', () => {
        console.log('Received gamecrashed');
        get().handleGameCrashed();
      });

      connection.on('betplaced', (response: { success: boolean; amount?: number; message?: string }) => {
        console.log('Received betplaced:', response);
        get().handleBetPlaced(response);
      });

      connection.on('withdrawsuccess', (response: { success: boolean; message?: string }) => {
        console.log('Received withdrawsuccess:', response);
        get().handleWithdrawSuccess(response);
      });

      connection.on('balanceupdate', (balanceUpdate: any) => {
        console.log('Received balanceupdate:', balanceUpdate);
        get().handleBalanceUpdate(balanceUpdate);
      });

      connection.on('error', (error: string) => {
        console.log('Received error from server:', error);
        get().setError(error);
      });

      // Dodatkowe obsługa dla różnych wariantów nazw (z wielkimi literami)
      connection.on('GameUpdate', (gameUpdate: CrashGameUpdate) => {
        console.log('Received GameUpdate:', gameUpdate);
        get().handleGameUpdate(gameUpdate);
      });

      connection.on('BalanceUpdate', (balanceUpdate: any) => {
        console.log('Received BalanceUpdate:', balanceUpdate);
        get().handleBalanceUpdate(balanceUpdate);
      });

      connection.on('BetPlaced', (response: { success: boolean; amount?: number; message?: string }) => {
        console.log('Received BetPlaced:', response);
        get().handleBetPlaced(response);
      });

      connection.on('WithdrawSuccess', (response: { success: boolean; message?: string }) => {
        console.log('Received WithdrawSuccess:', response);
        get().handleWithdrawSuccess(response);
      });

      console.log('Starting SignalR connection...');
      await connection.start();
      
      console.log('SignalR connection started successfully');
      set({
        connection,
        connected: true,
        error: null
      });

      // Request initial balance po połączeniu
      setTimeout(async () => {
        console.log('Requesting initial balance...');
        await get().requestBalance();
      }, 1000);
      
    } catch (error) {
      console.error('SignalR connection failed:', error);
      set({
        connected: false,
        connection: null,
        error: 'Connection failed: ' + (error instanceof Error ? error.message : String(error))
      });
    }
  },

  disconnect: async () => {
    const { connection } = get();
    if (connection) {
      try {
        console.log('Disconnecting from SignalR...');
        await connection.stop();
      } catch (error) {
        console.error('Error during disconnect:', error);
      } finally {
        set({
          connection: null,
          connected: false
        });
      }
    }
  },

  // Balance management
  requestBalance: async () => {
    const { connection, connected } = get();
    
    if (!connection || !connected) {
      console.log('Cannot request balance - not connected');
      return;
    }

    if (connection.state !== signalR.HubConnectionState.Connected) {
      console.log('Cannot request balance - connection state:', connection.state);
      return;
    }

    try {
      console.log('Requesting balance from server...');
      await connection.invoke('GetBalance');
      console.log('Balance request sent successfully');
    } catch (error) {
      console.error('Failed to request balance:', error);
      // Nie ustawiamy error dla balance request - może być tymczasowy problem
    }
  },

  // Game actions
  placeBet: async (userId?: string) => {
    const { connection, betAmount, connected } = get();
    const state = get();
    
    console.log('placeBet called:', { userId, betAmount, connected });
    
    // Sprawdź połączenie
    if (!connection || !connected) {
      const errorMsg = 'No connection to server';
      console.error('Cannot place bet:', errorMsg);
      set({ error: errorMsg });
      return;
    }

    if (connection.state !== signalR.HubConnectionState.Connected) {
      const errorMsg = `Connection not ready (state: ${connection.state})`;
      console.error('Cannot place bet:', errorMsg);
      set({ error: errorMsg });
      return;
    }

    // Sprawdź warunki gry
    if (!canPlaceBet(state, userId)) {
      console.log('Cannot place bet - game conditions not met');
      return;
    }

    if (betAmount <= 0) {
      const errorMsg = 'Invalid bet amount';
      console.error('Cannot place bet:', errorMsg);
      set({ error: errorMsg });
      return;
    }

    try {
      set({ loading: true, error: null });
      console.log('Sending PlaceBet request with amount:', betAmount);

      // Spróbuj różnych formatów danych
      await connection.invoke('PlaceBet', { BetAmount: betAmount });
      
      console.log('PlaceBet request sent successfully');
      
    } catch (error) {
      console.error('PlaceBet failed:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      set({ 
        error: `Failed to place bet: ${errorMsg}`, 
        loading: false 
      });
      
      // Jeśli błąd dotyczy połączenia, spróbuj reconnect
      if (errorMsg.includes('Connection') || errorMsg.includes('connection')) {
        console.log('Connection error detected, attempting reconnect...');
        setTimeout(() => get().connect(), 2000);
      }
    }
  },

  withdraw: async (userId?: string) => {
    const { connection, connected } = get();
    const state = get();
    
    console.log('withdraw called:', { userId, connected });
    
    // Sprawdź połączenie
    if (!connection || !connected) {
      const errorMsg = 'No connection to server';
      console.error('Cannot withdraw:', errorMsg);
      set({ error: errorMsg });
      return;
    }

    if (connection.state !== signalR.HubConnectionState.Connected) {
      const errorMsg = `Connection not ready (state: ${connection.state})`;
      console.error('Cannot withdraw:', errorMsg);
      set({ error: errorMsg });
      return;
    }

    // Sprawdź warunki gry
    if (!canWithdraw(state, userId)) {
      console.log('Cannot withdraw - game conditions not met');
      return;
    }

    try {
      set({ loading: true, error: null });
      console.log('Sending Withdraw request...');

      await connection.invoke('Withdraw');
      
      console.log('Withdraw request sent successfully');
      
    } catch (error) {
      console.error('Withdraw failed:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      set({ 
        error: `Failed to withdraw: ${errorMsg}`, 
        loading: false 
      });
      
      // Jeśli błąd dotyczy połączenia, spróbuj reconnect
      if (errorMsg.includes('Connection') || errorMsg.includes('connection')) {
        console.log('Connection error detected, attempting reconnect...');
        setTimeout(() => get().connect(), 2000);
      }
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
    console.log('Processing bet placed response:', response);
    set({ loading: false });
    if (response.success) {
      set({ error: null });
      // Request updated balance after successful bet
      setTimeout(() => get().requestBalance(), 500);
    } else {
      set({ error: response.message || 'Failed to place bet' });
    }
  },

  handleWithdrawSuccess: (response: { success: boolean; message?: string }) => {
    console.log('Processing withdraw response:', response);
    set({ loading: false });
    if (response.success) {
      set({ error: null });
      // Request updated balance after successful withdraw
      setTimeout(() => get().requestBalance(), 500);
    } else {
      set({ error: response.message || 'Failed to withdraw' });
    }
  },

  handleBalanceUpdate: (balanceUpdate: any) => {
    console.log('Processing balance update - RAW:', balanceUpdate);
    
    // Sprawdź różne możliwe struktury
    let balance = 0;
    if (typeof balanceUpdate === 'number') {
      balance = balanceUpdate;
    } else if (balanceUpdate && typeof balanceUpdate.balance === 'number') {
      balance = balanceUpdate.balance;
    } else if (balanceUpdate && typeof balanceUpdate.Balance === 'number') {
      balance = balanceUpdate.Balance;
    } else if (balanceUpdate && balanceUpdate.data && typeof balanceUpdate.data.balance === 'number') {
      balance = balanceUpdate.data.balance;
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
      console.log('Auto cash out triggered at:', state.multiplier);
      get().withdraw(userId);
    }
  }
}));

// Helper functions
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