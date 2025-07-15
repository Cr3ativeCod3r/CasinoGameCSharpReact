import { makeAutoObservable, runInAction } from 'mobx';
import * as signalR from '@microsoft/signalr';
import { cookieUtils } from '@/app/utils/cookies';
import authStore from './AuthStore';

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

class CrashGameStore {
  // Game state
  multiplier: number = 1.0;
  xChart: number = 0.0;
  yChart: number = 0.0;
  bets: { [key: string]: CrashBet } = {};
  timeRemaining: number = 10.0;
  bettingOpen: boolean = true;
  gameActive: boolean = false;
  
  // User balance
  balance: number = 0;
  
  // UI state
  betAmount: number = 0;
  autoCashOut: number = 0;
  loading: boolean = false;
  error: string | null = null;
  connected: boolean = false;
  
  // SignalR
  private connection: signalR.HubConnection | null = null;
  private url: string = "http://localhost:5000";

  constructor() {
    makeAutoObservable(this);
  }

  // Connection management
  async connect() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      const token = cookieUtils.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${this.url}/crashGameHub`, {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

      // Event handlers
      this.connection.on('GameUpdate', (gameUpdate: CrashGameUpdate) => {
        this.handleGameUpdate(gameUpdate);
      });

      this.connection.on('GameCrashed', () => {
        this.handleGameCrashed();
      });

      this.connection.on('BetPlaced', (response: { success: boolean; amount?: number; message?: string }) => {
        this.handleBetPlaced(response);
      });

      this.connection.on('WithdrawSuccess', (response: { success: boolean; message?: string }) => {
        this.handleWithdrawSuccess(response);
      });

      this.connection.on('BalanceUpdate', (balanceUpdate: BalanceUpdate) => {
        this.handleBalanceUpdate(balanceUpdate);
      });

      this.connection.on('Error', (error: string) => {
        this.setError(error);
      });

      await this.connection.start();
      runInAction(() => {
        this.connected = true;
        this.error = null;
      });

      console.log('Connected to Crash Game Hub');
      
      // Request initial balance
      await this.requestBalance();
    } catch (error) {
      console.error('Connection failed:', error);
      runInAction(() => {
        this.connected = false;
        this.error = 'Connection failed';
      });
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      runInAction(() => {
        this.connected = false;
      });
    }
  }

  // Balance management
  async requestBalance() {
    if (!this.connection) return;
    
    try {
      await this.connection.invoke('GetBalance');
    } catch (error) {
      console.error('Failed to request balance:', error);
    }
  }

  // Game actions
  async placeBet() {
    if (!this.connection || !this.bettingOpen || this.betAmount <= 0) {
      return;
    }

    try {
      this.setLoading(true);
      this.setError(null);

      await this.connection.invoke('PlaceBet', {
        betAmount: this.betAmount
      } as PlaceBetRequest);
    } catch (error) {
      console.error('Place bet failed:', error);
      this.setError('Failed to place bet');
      this.setLoading(false);
    }
  }

  async withdraw() {
    if (!this.connection || !this.gameActive) {
      return;
    }

    try {
      this.setLoading(true);
      this.setError(null);

      await this.connection.invoke('Withdraw');
    } catch (error) {
      console.error('Withdraw failed:', error);
      this.setError('Failed to withdraw');
      this.setLoading(false);
    }
  }

  // Event handlers
  private handleGameUpdate(gameUpdate: CrashGameUpdate) {
    runInAction(() => {
      this.multiplier = gameUpdate.multiplier;
      this.xChart = gameUpdate.xChart;
      this.yChart = gameUpdate.yChart;
      this.bets = gameUpdate.bets;
      this.timeRemaining = gameUpdate.timeRemaining;
      this.bettingOpen = gameUpdate.bettingOpen;
      this.gameActive = gameUpdate.gameActive;
    });
  }

  private handleGameCrashed() {
    runInAction(() => {
      this.gameActive = false;
    });
    console.log('Game crashed at:', this.multiplier.toFixed(2) + 'x');
  }

  private handleBetPlaced(response: { success: boolean; amount?: number; message?: string }) {
    runInAction(() => {
      this.loading = false;
      if (response.success) {
        this.error = null;
        // Reset bet amount after successful bet
        this.betAmount = 0;
      } else {
        this.error = response.message || 'Failed to place bet';
      }
    });
  }

  private handleWithdrawSuccess(response: { success: boolean; message?: string }) {
    runInAction(() => {
      this.loading = false;
      if (response.success) {
        this.error = null;
      } else {
        this.error = response.message || 'Failed to withdraw';
      }
    });
  }

  private handleBalanceUpdate(balanceUpdate: BalanceUpdate) {
    runInAction(() => {
      this.balance = balanceUpdate.balance;
    });
  }

  // Setters
  setBetAmount(amount: number) {
    this.betAmount = amount;
  }

  setAutoCashOut(amount: number) {
    this.autoCashOut = amount;
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  // Getters
  get currentUserBet(): CrashBet | null {
    if (!authStore.user) return null;
    return this.bets[authStore.user.id] || null;
  }

  get hasActiveBet(): boolean {
    return this.currentUserBet !== null;
  }

  get canPlaceBet(): boolean {
    return this.connected && this.bettingOpen && !this.hasActiveBet && this.betAmount > 0 && this.betAmount <= this.balance;
  }

  get canWithdraw(): boolean {
    return this.connected && this.gameActive && this.hasActiveBet && !this.currentUserBet?.inGame.withdrew;
  }

  get formattedMultiplier(): string {
    return this.multiplier.toFixed(2) + 'x';
  }

  get formattedTimeRemaining(): string {
    return Math.max(0, this.timeRemaining).toFixed(1) + 's';
  }

  get formattedBalance(): string {
    return this.balance.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  get betsArray(): CrashBet[] {
    return Object.values(this.bets);
  }

  // Auto cash out logic
  checkAutoCashOut() {
    if (this.autoCashOut > 0 && 
        this.gameActive && 
        this.multiplier >= this.autoCashOut && 
        this.canWithdraw) {
      this.withdraw();
    }
  }
}

export default new CrashGameStore();