import { useEffect } from 'react';
import { getSocket } from '../services/socket';

export const useSocket = (eventHandlers = {}) => {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const entries = Object.entries(eventHandlers);
    entries.forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      entries.forEach(([event, handler]) => socket.off(event, handler));
    };
  }, []);
};
