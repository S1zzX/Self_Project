import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Only connect if user is authenticated and has a token
    if (user && token) {
      console.log('🔌 Connecting to Socket.IO server...');
      
      const newSocket = io('http://localhost:3001', {
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: maxReconnectAttempts
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ Socket.IO connected:', newSocket.id);
        setIsConnected(true);
        reconnectAttempts.current = 0;
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error.message);
        setIsConnected(false);
        reconnectAttempts.current++;
        
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached. Please refresh the page.');
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server disconnected the socket, try to reconnect manually
          newSocket.connect();
        }
      });

      // Online users management
      newSocket.on('online_users', (users) => {
        console.log('👥 Online users:', users);
        setOnlineUsers(users);
      });

      newSocket.on('user_online', (data) => {
        console.log('✅ User came online:', data.userId);
        setOnlineUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      });

      newSocket.on('user_offline', (data) => {
        console.log('❌ User went offline:', data.userId);
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      });

      setSocket(newSocket);

      // Cleanup on unmount or when dependencies change
      return () => {
        console.log('🔌 Disconnecting Socket.IO...');
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      };
    } else {
      // If user logs out, disconnect socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      }
    }
  }, [user, token]);

  const value = {
    socket,
    isConnected,
    onlineUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
