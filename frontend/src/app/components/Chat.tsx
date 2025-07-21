import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import useAuthStore from '@/app/stores/AuthStore';
import axios from 'axios';

// Typy dla TypeScript
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

  // Inicjalizuj store na początku
  useEffect(() => {
    if (!isInitialized) {
      initialize();
      setIsInitialized(true);
    }
  }, [initialize, isInitialized]);

  // Przewiń do dołu
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Pobierz stare wiadomości z API
  const fetchOldMessages = async (): Promise<void> => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const oldMessages: ChatMessage[] = response.data;
      setMessages(oldMessages.reverse()); 
    } catch (error) {
      console.error('Błąd pobierania starych wiadomości:', error);
    }
  };

  // Inicjalizacja SignalR
  useEffect(() => {
    // Nie inicjalizuj połączenia jeśli nie ma tokenu lub użytkownika
    if (!isInitialized || !isAuthenticated || !token || !user) {
      console.log('Brak wymaganych danych do połączenia:', { isInitialized, isAuthenticated, hasToken: !!token, hasUser: !!user });
      return;
    }
    
    console.log('Inicjalizacja SignalR dla użytkownika:', user);
    
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/crashHub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    setConnection(newConnection);

    // Uruchom połączenie
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

    // Obsługa otrzymanych wiadomości
    newConnection.on('ReceiveMessage', (message: ChatMessage) => {
      console.log('Otrzymano wiadomość:', message);
      setMessages(prevMessages => [...prevMessages, message]);
    });

    // Obsługa błędów
    newConnection.on('Error', (error: string) => {
      console.error('Błąd z serwera:', error);
      alert(error);
    });

    // Obsługa reconnection
    newConnection.onreconnected(() => {
      console.log('Ponownie połączono z SignalR');
      setIsConnected(true);
      fetchOldMessages();
    });

    newConnection.onclose((error) => {
      console.log('Połączenie z SignalR zamknięte:', error);
      setIsConnected(false);
    });

    // Cleanup
    return () => {
      console.log('Zamykanie połączenia SignalR');
      newConnection.stop();
    };
  }, [isInitialized, isAuthenticated, token, user]);

  // Przewiń do dołu po dodaniu nowej wiadomości
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Wyślij wiadomość
  const sendMessage = async (): Promise<void> => {
    if (inputMessage.trim() && connection && isConnected) {
      try {
        console.log('Wysyłanie wiadomości:', inputMessage);
        await connection.invoke('SendMessage', inputMessage.trim());
        setInputMessage('');
      } catch (error) {
        console.error('Błąd wysyłania wiadomości:', error);
        alert('Nie udało się wysłać wiadomości');
      }
    }
  };

  // Obsługa formularza
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    sendMessage();
  };

  // Sprawdź czy inicjalizacja się zakończyła
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

  // Sprawdź czy użytkownik jest zalogowany
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
      {/* Status połączenia */}
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

      {/* Okno chatu */}
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
      <div className="mt-3">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
          placeholder={isConnected ? "Napisz wiadomość..." : "Rozłączono..."}
          className="p-2 text-black"
          style={{
            width: '92%',
            backgroundColor: '#bbb1b1'
          }}
          disabled={!isConnected}
          maxLength={500}
        />
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={!isConnected || !inputMessage.trim()}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Wyślij
        </button>
      </div>
    </div>
  );
};

export default Chat;