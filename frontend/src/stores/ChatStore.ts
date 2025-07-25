import { create } from "zustand";
import axios from "axios";
import useConnectionStore from "./ConnectionStore";
import useAuthStore from "./AuthStore";

import type{ ChatMessage } from "@/types/chat";
import type{ ChatActions, ChatState } from '@/types/chat';


const apiUrl = import.meta.env.VITE_API_URL || "http://localhos:5000";
type ChatStore = ChatState & ChatActions;

const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  inputMessage: "",
  loading: false,
  error: null,

  setInputMessage: (message: string) => {
    set({ inputMessage: message });
  },

  sendMessage: async () => {
    const { inputMessage } = get();
    const connectionStore = useConnectionStore.getState();
    const connection = connectionStore.getConnection();
    const isConnected = connectionStore.isConnected();

    if (!inputMessage.trim() || !connection || !isConnected) {
      return;
    }

    try {
      await connection.invoke("SendMessage", inputMessage.trim());
      set({ inputMessage: "", error: null });
    } catch (error) {
      set({ error: "Nie udało się wysłać wiadomości" });
    }
  },

  fetchMessages: async () => {
    const authStore = useAuthStore.getState();
    const { token } = authStore;
    
    set({ loading: true, error: null });

    try {
      const response = await axios.get(apiUrl + "/api/chat/messages", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const oldMessages: ChatMessage[] = response.data;
      set({ messages: oldMessages.reverse(), loading: false });
    } catch (error) {
      set({ 
        error: "Nie udało się pobrać wiadomości", 
        loading: false 
      });
    }
  },

  addMessage: (message: ChatMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setupListeners: () => {
    const connectionStore = useConnectionStore.getState();
    const connection = connectionStore.getConnection();

    if (!connection) return;

    connection.on("ReceiveMessage", (message: ChatMessage) => {
      get().addMessage(message);
    });

    connection.on("Error", (error: string) => {
      get().setError(error);
    });
  },

  removeListeners: () => {
    const connectionStore = useConnectionStore.getState();
    const connection = connectionStore.getConnection();

    if (!connection) return;

    connection.off("ReceiveMessage");
    connection.off("Error");
  },
}));

export default useChatStore;