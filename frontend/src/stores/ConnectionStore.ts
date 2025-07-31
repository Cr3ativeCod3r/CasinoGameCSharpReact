import { create } from "zustand";
import * as signalR from "@microsoft/signalr";
import useAuthStore from "./AuthStore";
import type { ConnectionActions, ConnectionState } from '@/types/signalR';

type ConnectionStore = ConnectionState & ConnectionActions;


const apiUrl = import.meta.env.VITE_API_URL || "http://localhos:5000";

const useConnectionStore = create<ConnectionStore>((set, get) => ({
  connection: null,
  connected: false,
  connecting: false,
  error: null,
  url: apiUrl,

  connect: async () => {
    const state = get();
    
    if (state.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (state.connecting) {
      return;
    }

    set({ connecting: true, error: null });

    if (state.connection) {
      try {
        await state.connection.stop();
      } catch (e) {
        console.error("Error stopping existing connection:", e);
      }
    }

    try {
      const authStore = useAuthStore.getState();
      const token = authStore.token || "";

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${state.url}/crashHub`, {
          accessTokenFactory: () => token,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount === 0) {
              return 0;
            }
            return Math.min(
              1000 * Math.pow(2, retryContext.previousRetryCount),
              30000
            );
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      connection.onclose((error) => {
        set({ connected: false, connecting: false });
        if (error) {
          set({ error: `Connection closed: ${error.message}` });
        }
      });

      connection.onreconnecting((error) => {
        set({ connected: false, error: "Reconnecting..." });
        console.log(error?.message)
      });

      connection.onreconnected((connectionId) => {
        set({ connected: true, error: null });
        console.log(connectionId)
      });

      await connection.start();

      set({
        connection,
        connected: true,
        connecting: false,
        error: null,
      });
    } catch (error) {
      console.error("SignalR connection failed:", error);
      set({
        connected: false,
        connecting: false,
        connection: null,
        error:
          "Connection failed: " +
          (error instanceof Error ? error.message : String(error)),
      });
    }
  },

  disconnect: async () => {
    const { connection } = get();
    if (connection) {
      try {
        await connection.stop();
      } catch (error) {
        console.error("Error during disconnect:", error);
      } finally {
        set({
          connection: null,
          connected: false,
          connecting: false,
        });
      }
    }
  },

  getConnection: () => {
    return get().connection;
  },

  isConnected: () => {
    const { connection, connected } = get();
    return !!(connection && connected && connection.state === signalR.HubConnectionState.Connected);
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));

export default useConnectionStore;