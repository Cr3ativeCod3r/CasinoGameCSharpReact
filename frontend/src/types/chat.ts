export interface ChatMessage {
  id?: string;
  userId: string;
  userNick: string;
  content: string;
  createdAt: string;
}

export interface ChatProps {
  className?: string;
  style?: React.CSSProperties;
}

export interface ChatState {
  messages: ChatMessage[];
  inputMessage: string;
  loading: boolean;
  error: string | null;
}

export interface ChatActions {
  setInputMessage: (message: string) => void;
  sendMessage: () => Promise<void>;
  fetchMessages: () => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setError: (error: string | null) => void;
  setupListeners: () => void;
  removeListeners: () => void;
}
