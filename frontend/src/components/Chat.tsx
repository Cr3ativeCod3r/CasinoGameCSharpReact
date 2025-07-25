import React, { useLayoutEffect, useRef } from 'react';
import useChatStore from '@/stores/ChatStore';
import useAuthStore from '@/stores/AuthStore';
import useConnectionStore from '@/stores/ConnectionStore';
import type { ChatProps } from "@/types/chat";

const Chat: React.FC<ChatProps> = ({ className, style }) => {
  const { user } = useAuthStore();
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

  return (
    <div className={`flex-1 flex flex-col ${className || ''}`} style={style}>
  
    <div
  className="h-full border border-black overflow-y-scroll text-white p-1"
  style={{ backgroundColor: 'rgb(24, 26, 30)', maxHeight: 'calc(100% - 60px)' }}
>
        {messages.length === 0 ? (
          null
        ) : (
          messages.map((msg, index) => (
            <div key={msg.id || index} className="mb-1 text-xs leading-tight">
              <span className="text-gray-500 mr-1">
                {msg.createdAt}
              </span>
              <span className={`mr-1 font-medium ${user && msg.userId === user.id ? 'text-blue-400' : 'text-orange-400'}`}>
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

      {!user ? (
        <div className="mt-2 flex">
          <div 
            className="p-2 text-sm text-gray-500 flex-1 rounded-l text-center"
            style={{ backgroundColor: '#bbb1b1' }}
          >
            Login Required
          </div>
          <div className="ml-1 px-3 py-1 text-sm bg-gray-500 text-white flex items-center rounded-r cursor-not-allowed">
            Send
          </div>
        </div>
      ) : (
        <form className="mt-2 flex" onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e); }}
            placeholder={isConnected ? "Message..." : "Disconnected..."}
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
            Send
          </button>
        </form>
      )}
    </div>
  );
};

export default Chat;