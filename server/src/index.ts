import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { BOARD_SIZE, MAX_PLAYERS, MIN_PLAYERS } from '@cotiphu/shared';

const PORT = Number(process.env.PORT ?? 3001);

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' },
});

io.on('connection', (socket) => {
  socket.emit('server:hello', {
    boardSize: BOARD_SIZE,
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server Cờ tỉ phú chạy ở cổng ${PORT}`);
});
