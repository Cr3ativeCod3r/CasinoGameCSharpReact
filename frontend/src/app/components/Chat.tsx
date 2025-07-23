import React, { useEffect, useRef } from 'react';
import useChatStore from '@/app/stores/ChatStore';
import useAuthStore from '@/app/stores/AuthStore';
import useConnectionStore from '@/app/stores/ConnectionStore';
import { ChatProps } from "@/app/types/chat";

const Chat: React.FC<ChatProps> = ({ className, style }) => {
  const { isAuthenticated, user } = useAuthStore();
  const { connected: isConnected } = useConnectionStore();
  const {
    messages,
    inputMessage,
    setInputMessage,
    sendMessage,
    error
  } = useChatStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent | React.KeyboardEvent): void => {
    e.preventDefault();
    sendMessage();
  };

  if (!isAuthenticated || !user) {
    return (
      <div className={`flex-1 ${className || ''}`} style={style}>
        <div
          className="h-64 border border-black overflow-y-scroll text-white p-2 flex items-center justify-center"
          style={{ backgroundColor: 'rgb(24, 26, 30)' }}
        >
          <p className="text-gray-400">Musisz być zalogowany, aby korzystać z chatu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 ${className || ''}`} style={style}>
      <div className="mb-2">
        <span className={`text-xs px-2 py-1 rounded ${isConnected ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {isConnected ? 'Połączono' : 'Rozłączono'}
        </span>
        {user && (
          <span className="ml-2 text-xs text-gray-400">
            Zalogowany jako: {user.nickName}
          </span>
        )}
      </div>

      <div
        className="h-full border border-black overflow-y-scroll text-white p-2"
        style={{ backgroundColor: 'rgb(24, 26, 30)' }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Brak wiadomości</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={msg.id || index} className="mb-1 text-xs">
              <span className="text-gray-400 text-xs">
                {msg.createdAt}
              </span>
              <span className={`ml-2 ${msg.userId === user.id ? 'text-blue-400' : 'text-orange-400'}`}>
                {msg.userNick}:
              </span>
              <span className="ml-2">{msg.content}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="text-red-400 text-xs mt-2 px-2">
          {error}
        </div>
      )}

      <form className="mt-3 flex" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e);
          }}
          placeholder={isConnected ? "Napisz wiadomość..." : "Rozłączono..."}
          className="p-2 text-black flex-1"
          style={{
            backgroundColor: '#bbb1b1'
          }}
          disabled={!isConnected}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!isConnected || !inputMessage.trim()}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Wyślij
        </button>
      </form>
    </div>
  );
};

export default Chat;