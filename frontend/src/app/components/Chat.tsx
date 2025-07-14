import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import * as signalR from '@microsoft/signalr';
import authStore from '@/app/stores/AuthStore';
import { cookieUtils } from '@/app/utils/cookies';
import { ChatProps,ChatMessage  } from '@/app/types/chat'; 

const Chat: React.FC<ChatProps> = observer(({ className, style }) => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pobierz token z cookies
  const getToken = (): string | null => {
    return cookieUtils.getToken();
  };

  // Przewiń do dołu
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Pobierz stare wiadomości z API
  const fetchOldMessages = async (): Promise<void> => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${authStore.url}/api/chat/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const oldMessages: ChatMessage[] = await response.json();
        setMessages(oldMessages.reverse()); // Odwróć kolejność - najstarsze na górze
      }
    } catch (error) {
      console.error('Błąd pobierania starych wiadomości:', error);
    }
  };

  // Inicjalizacja SignalR
  useEffect(() => {
    const token = getToken();
    // if (!token || !authStore.isAuthenticated) {
    //   console.error('Brak tokena autoryzacji lub użytkownik nie jest zalogowany');
    //   return;
    // }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${authStore.url}/chatHub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    // Uruchom połączenie
    newConnection.start()
      .then(() => {
        console.log('Połączono z SignalR');
        setIsConnected(true);
        fetchOldMessages(); // Pobierz stare wiadomości po połączeniu
      })
      .catch((err: Error) => {
        console.error('Błąd połączenia z SignalR:', err);
        setIsConnected(false);
      });

    // Obsługa otrzymanych wiadomości
    newConnection.on('ReceiveMessage', (message: ChatMessage) => {
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
    });

    newConnection.onclose(() => {
      console.log('Połączenie z SignalR zamknięte');
      setIsConnected(false);
    });

    // Cleanup
    return () => {
      newConnection.stop();
    };
  }, [authStore.isAuthenticated]);

  // Przewiń do dołu po dodaniu nowej wiadomości
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Wyślij wiadomość
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

  // Obsługa formularza
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    sendMessage();
  };

  // Sprawdź czy użytkownik jest zalogowany
//   if (!authStore.isAuthenticated) {
//     return (
//       <div className="flex-1">
//         <div 
//           className="h-64 border border-black overflow-y-scroll text-white p-2 flex items-center justify-center"
//           style={{ backgroundColor: 'rgb(24, 26, 30)' }}
//         >
//           <p className="text-gray-400">Musisz być zalogowany, aby korzystać z chatu.</p>
//         </div>
//       </div>
//     );
//   }

  return (
    <div className={`flex-1 ${className || ''}`} style={style}>
      <div 
        className="h-64 border border-black overflow-y-scroll text-white p-2"
        style={{ backgroundColor: 'rgb(24, 26, 30)' }}
      >
        {messages.map((msg, index) => (
          <div key={msg.id || index} className="mb-1 text-xs">
            <span className="text-gray-400 text-xs">
              {msg.createdAt}
            </span>
            <span className={`ml-2 ${msg.userId === authStore.user?.id ? 'text-blue-400' : 'text-orange-400'}`}>
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
});

export default Chat;