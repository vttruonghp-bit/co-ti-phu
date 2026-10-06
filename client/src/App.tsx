import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Board } from './Board';

export function App() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io();
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <main className="app">
      <p className="status">{connected ? 'Đã kết nối server' : 'Chưa kết nối server'}</p>
      <Board />
    </main>
  );
}
