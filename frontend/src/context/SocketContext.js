// frontend/src/context/SocketContext.js - ENHANCED
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { info } = useNotification();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      
      const newSocket = io(process.env.REACT_APP_BASE_URL || 'http://localhost:5000', {
        auth: { token },
        timeout: 50000,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling']
        
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsConnected(true);
        
        // Join user's personal room for notifications
        newSocket.emit('user:join', user._id);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Notification events
      newSocket.on('notification:new', (notification) => {
        info(notification.message);
        window.dispatchEvent(new Event('notification:new'));
      });

      // Request events
      newSocket.on('request:new', (data) => {
        window.dispatchEvent(new CustomEvent('request:new', { detail: data }));
      });

      newSocket.on('request:update', (data) => {
        window.dispatchEvent(new CustomEvent('request:update', { detail: data }));
      });

      // User presence
      newSocket.on('user:online', (data) => {
        console.log('User online:', data.userId);
      });

      newSocket.on('user:offline', (data) => {
        console.log('User offline:', data.userId);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user]);

  const value = {
    socket,
    isConnected
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};