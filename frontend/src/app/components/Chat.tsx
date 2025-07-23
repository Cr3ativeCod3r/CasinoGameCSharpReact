import React, { useLayoutEffect, useRef } from 'react';
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
  
  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent | React.KeyboardEvent): void => {
    e.preventDefault();
    sendMessage();
  };

  if (!isAuthenticated || !user) {
    return (
      <div className={`flex-1 flex ${className || ''}`} style={style}>
        <div
          className="h-full w-full border border-black overflow-y-scroll text-white p-2 flex items-center justify-center"
          style={{ backgroundColor: 'rgb(24, 26, 30)' }}
        >
          <p className="text-gray-400 text-sm">Musisz być zalogowany, aby korzystać z chatu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col ${className || ''}`} style={style}>
  
    <div
  className="min-h-0 border border-black overflow-y-scroll text-white p-1"
  style={{ backgroundColor: 'rgb(24, 26, 30)', maxHeight: 'calc(100% - 60px)' }}
>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-xs">Brak wiadomości</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={msg.id || index} className="mb-1 text-xs leading-tight">
              <span className="text-gray-500 mr-1">
                {msg.createdAt}
              </span>
              <span className={`mr-1 font-medium ${msg.userId === user.id ? 'text-blue-400' : 'text-orange-400'}`}>
                {msg.userNick}:
              </span>
              <span className="break-words">{msg.content}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="text-red-400 text-xs mt-1 px-1">
          {error}
        </div>
      )}

      <form className="mt-2 flex" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e); }}
          placeholder={isConnected ? "Wiadomość..." : "Rozłączono..."}
          className="p-2 text-sm text-black flex-1 rounded-l"
          style={{ backgroundColor: '#bbb1b1' }}
          disabled={!isConnected}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!isConnected || !inputMessage.trim()}
          className="ml-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-r hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          Wyślij
        </button>
      </form>
    </div>
  );
};

export default Chat;