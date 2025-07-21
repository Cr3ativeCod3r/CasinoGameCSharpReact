import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import useAuthStore from '@/app/stores/AuthStore';
import axios from 'axios';

interface ChatMessage {
  id?: string;
  userId: string;
  userNick: string;
  content: string;
  createdAt: string;
}

interface ChatProps {
  className?: string;
  style?: React.CSSProperties;
}

const Chat: React.FC<ChatProps> = ({ className, style }) => {
  const { isAuthenticated, user, token, initialize } = useAuthStore();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    if (!isInitialized) {
      initialize();
      setIsInitialized(true);
    }
  }, [initialize, isInitialized]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchOldMessages = async (): Promise<void> => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const oldMessages: ChatMessage[] = response.data;
      setMessages(oldMessages.reverse());
    } catch (error) {
      // error handling
    }
  };

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !token || !user) {
      return;
    }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/crashHub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    setConnection(newConnection);

    newConnection.start()
      .then(() => {
        setIsConnected(true);
        fetchOldMessages();
      })
      .catch(() => {
        setIsConnected(false);
      });

    newConnection.on('ReceiveMessage', (message: ChatMessage) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });

    newConnection.on('Error', (error: string) => {
      alert(error);
    });

    newConnection.onreconnected(() => {
      setIsConnected(true);
      fetchOldMessages();
    });

    newConnection.onclose(() => {
      setIsConnected(false);
    });

    return () => {
      newConnection.stop();
    };
  }, [isInitialized, isAuthenticated, token, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (): Promise<void> => {
    if (inputMessage.trim() && connection && isConnected) {
      try {
        await connection.invoke('SendMessage', inputMessage.trim());
        setInputMessage('');
      } catch {
        alert('Nie udało się wysłać wiadomości');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent | React.KeyboardEvent): void => {
    e.preventDefault();
    sendMessage();
  };

  if (!isInitialized) {
    return (
      <div className={`flex-1 ${className || ''}`} style={style}>
        <div 
          className="h-64 border border-black overflow-y-scroll text-white p-2 flex items-center justify-center"
          style={{ backgroundColor: 'rgb(24, 26, 30)' }}
        >
          <p className="text-gray-400">Ładowanie...</p>
        </div>
      </div>
    );
  }

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
        className="h-64 border border-black overflow-y-scroll text-white p-2"
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

      {/* Formularz wysyłania wiadomości */}
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