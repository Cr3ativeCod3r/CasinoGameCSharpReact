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