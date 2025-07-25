export interface ConnectionState {
  connection: signalR.HubConnection | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  url: string;
}

export interface ConnectionActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getConnection: () => signalR.HubConnection | null;
  isConnected: () => boolean;
  setError: (error: string | null) => void;
}