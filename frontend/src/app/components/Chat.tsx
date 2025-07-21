import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import useAuthStore from '@/app/stores/AuthStore';
import { cookieUtils } from '@/app/utils/cookies';
import { ChatProps, ChatMessage } from '@/app/types/chat';

const Chat: React.FC<ChatProps> = ({ className, style }) => {
  const { isAuthenticated, user, token } = useAuthStore();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL ="http://localhost:5000"

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchOldMessages = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/api/chat/messages`); 
      if (response.ok) {
        const oldMessages: ChatMessage[] = await response.json();
        setMessages(oldMessages.reverse());
      }
    } catch (error) {
      console.error('Błąd pobierania starych wiadomości:', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }
    
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/crashHub?access_token=${token}`)
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    newConnection.start()
      .then(() => {
        console.log('Połączono z SignalR');
        setIsConnected(true);
        fetchOldMessages();
      })
      .catch((err: Error) => {
        console.error('Błąd połączenia z SignalR:', err);
        setIsConnected(false);
      });

    newConnection.on('ReceiveMessage', (message: ChatMessage) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });

    newConnection.on('Error', (error: string) => {
      console.error('Błąd z serwera:', error);
      alert(error);
    });

    newConnection.onreconnected(() => {
      console.log('Ponownie połączono z SignalR');
      setIsConnected(true);
    });

    newConnection.onclose(() => {
      console.log('Połączenie z SignalR zamknięte');
      setIsConnected(false);
    });

    return () => {
      newConnection.stop();
    };
  }, [isAuthenticated, token, API_URL]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (): Promise<void> => {
    if (inputMessage.trim() && connection && isConnected) {
      try {
        await connection.invoke('SendMessage', inputMessage);
        setInputMessage('');
      } catch (error) {
        console.error('Błąd wysyłania wiadomości:', error);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className={`flex-1 ${className || ''}`} style={style}>
      <div
        className="h-64 border border-black overflow-y-scroll text-white p-2"
        style={{ backgroundColor: 'rgb(24, 26, 30)' }}
      >
        {messages.map((msg, index) => (
          <div key={msg.id || index} className="mb-1 text-xs">
            <span className="text-gray-400 text-xs">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </span>
            <span className={`ml-2 ${msg.userId === user?.id ? 'text-blue-400' : 'text-orange-400'}`}>
              {msg.userNick}:
            </span>
            <span className="ml-2">{msg.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-3">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Napisz wiadomość..."
          className="p-2 text-black"
          style={{
            width: '92%',
            backgroundColor: '#bbb1b1'
          }}
          disabled={!isConnected}
        />
      </form>
    </div>
  );
};

export default Chat;