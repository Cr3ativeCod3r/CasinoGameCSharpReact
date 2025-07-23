import { create } from "zustand";
import {
  CrashBet,
  CrashGameUpdate,
  PlaceBetRequest,
  CrashGameState,
  CrashGameActions,
  CrashGamePhase,
} from "@/app/types/crash";
import useConnectionStore from "./ConnectionStore";

type CrashGameStore = CrashGameState & CrashGameActions;

const useCrashGameStore = create<CrashGameStore>((set, get) => ({
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
  url: process.env.NEXT_PUBLIC_API_URL,


  setupListeners: () => {
    const connectionStore = useConnectionStore.getState();
    const connection = connectionStore.getConnection();

    if (!connection) return;

    connection.on("GameCrasked", () => {
      get().handleGameCrashed();
    });

    connection.on("GameUpdate", (gameUpdate: CrashGameUpdate) => {
      get().handleGameUpdate(gameUpdate);
    });

    connection.on("BalanceUpdate", (balanceUpdate: any) => {
      get().handleBalanceUpdate(balanceUpdate);
    });

    connection.on(
      "BetPlaced",
      (response: { success: boolean; amount?: number; message?: string }) => {
        get().handleBetPlaced(response);
      }
    );

    connection.on(
      "WithdrawSuccess",
      (response: { success: boolean; message?: string }) => {
        get().handleWithdrawSuccess(response);
      }
    );

    connection.on("error", (error: string) => {
      get().setError(error);
    });
  },

  removeListeners: () => {
    const connectionStore = useConnectionStore.getState();
    const connection = connectionStore.getConnection();

    if (!connection) return;

    connection.off("GameCrasked");
    connection.off("GameUpdate");
    connection.off("BalanceUpdate");
    connection.off("BetPlaced");
    connection.off("WithdrawSuccess");
    connection.off("error");
  },

  requestBalance: async () => {
    const connectionStore = useConnectionStore.getState();
    const connection = connectionStore.getConnection();
    const isConnected = connectionStore.isConnected();

    if (!connection || !isConnected) {
      return;
    }

    try {
      await connection.invoke("GetBalance");
    } catch (error) {
      console.error("Failed to request balance:", error);
    }
  },

  placeBet: async (userId?: string) => {
    const connectionStore = useConnectionStore.getState();
    const connection = connectionStore.getConnection();
    const isConnected = connectionStore.isConnected();
    const { betAmount } = get();
    const state = get();

    if (!connection || !isConnected) {
      const errorMsg = "No connection to server";
      set({ error: errorMsg });
      return;
    }

    if (!canPlaceBet(state, userId)) {
      return;
    }

    if (betAmount <= 0) {
      const errorMsg = "Invalid bet amount";
      set({ error: errorMsg });
      return;
    }

    try {
      set({ loading: true, error: null });

      const request: PlaceBetRequest = { betAmount: betAmount };
      await connection.invoke("PlaceBet", request);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      set({
        error: `Failed to place bet: ${errorMsg}`,
        loading: false,
      });

      if (errorMsg.includes("Connection") || errorMsg.includes("connection")) {
        setTimeout(() => connectionStore.connect(), 2000);
      }
    }
  },

  withdraw: async (userId?: string) => {
    const connectionStore = useConnectionStore.getState();
    const connection = connectionStore.getConnection();
    const isConnected = connectionStore.isConnected();
    const state = get();

    if (!connection || !isConnected) {
      const errorMsg = "No connection to server";
      set({ error: errorMsg });
      return;
    }

    if (!canWithdraw(state, userId)) {
      return;
    }

    try {
      set({ loading: true, error: null });
      await connection.invoke("Withdraw");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      set({
        error: `Failed to withdraw: ${errorMsg}`,
        loading: false,
      });

      if (errorMsg.includes("Connection") || errorMsg.includes("connection")) {
        setTimeout(() => connectionStore.connect(), 2000);
      }
    }
  },

  handleGameUpdate: (gameUpdate: CrashGameUpdate) => {
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
      gameActive: gameUpdate.gameActive,
    });
  },

  handleGameCrashed: () => {
    set({
      gameActive: false,
      phase: CrashGamePhase.Crashed,
    });
  },

  handleBetPlaced: (response: {
    success: boolean;
    amount?: number;
    message?: string;
  }) => {
    set({ loading: false });
    if (response.success) {
      set({ error: null });
      setTimeout(() => get().requestBalance(), 500);
    } else {
      set({ error: response.message || "Failed to place bet" });
    }
  },

  handleWithdrawSuccess: (response: { success: boolean; message?: string }) => {
    set({ loading: false });
    if (response.success) {
      set({ error: null });
      setTimeout(() => get().requestBalance(), 500);
    } else {
      set({ error: response.message || "Failed to withdraw" });
    }
  },

  handleBalanceUpdate: (balanceUpdate: any) => {
    let balance = 0;
    if (typeof balanceUpdate === "number") {
      balance = balanceUpdate;
    } else if (balanceUpdate && typeof balanceUpdate.balance === "number") {
      balance = balanceUpdate.balance;
    } else if (balanceUpdate && typeof balanceUpdate.Balance === "number") {
      balance = balanceUpdate.Balance;
    } else if (
      balanceUpdate &&
      balanceUpdate.data &&
      typeof balanceUpdate.data.balance === "number"
    ) {
      balance = balanceUpdate.data.balance;
    } else {
      console.error("Unknown balance update structure:", balanceUpdate);
      return;
    }

    set({ balance: balance });
  },

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

  checkAutoCashOut: (userId?: string) => {
    const state = get();
    if (
      state.autoCashOut > 0 &&
      state.gameActive &&
      state.multiplier >= state.autoCashOut &&
      getCurrentUserBet(state, userId) &&
      canWithdraw(state, userId)
    ) {
      get().withdraw(userId);
    }
  },
}));

export const getCurrentUserBet = (
  state: CrashGameState,
  userId?: string
): CrashBet | null => {
  if (!userId) return null;
  return state.bets[userId] || null;
};

export const getHasActiveBet = (
  state: CrashGameState,
  userId?: string
): boolean => {
  return getCurrentUserBet(state, userId) !== null;
};

export const canPlaceBet = (
  state: CrashGameState,
  userId?: string
): boolean => {
  const connectionStore = useConnectionStore.getState();
  return (
    connectionStore.isConnected() &&
    state.phase === CrashGamePhase.Betting &&
    state.bettingOpen &&
    !getHasActiveBet(state, userId) &&
    state.betAmount > 0 &&
    state.betAmount <= state.balance
  );
};

export const canWithdraw = (
  state: CrashGameState,
  userId?: string
): boolean => {
  const connectionStore = useConnectionStore.getState();
  const currentBet = getCurrentUserBet(state, userId);
  return (
    connectionStore.isConnected() &&
    state.phase === CrashGamePhase.Running &&
    state.gameActive &&
    getHasActiveBet(state, userId) &&
    currentBet &&
    !currentBet.inGame?.withdrew
  );
};

export const getFormattedMultiplier = (state: CrashGameState): string => {
  return state.multiplier.toFixed(2) + "x";
};

export const getFormattedTimeRemaining = (state: CrashGameState): string => {
  return Math.max(0, state.timeRemaining).toFixed(1) + "s";
};

export const getFormattedBalance = (state: CrashGameState): string => {
  return state.balance.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const getBetsArray = (state: CrashGameState): CrashBet[] => {
  return Object.values(state.bets);
};

export default useCrashGameStore;