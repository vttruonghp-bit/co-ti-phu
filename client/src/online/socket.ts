import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@cotiphu/shared';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Chờ máy chủ trả lời tối đa chừng này. */
const WAIT_MS = 8000;

let socket: GameSocket | null = null;

/**
 * Một kết nối cho cả trang, cùng địa chỉ với trang (khi phát triển, Vite chuyển /socket.io
 * sang cổng 3001). Chỉ mở khi chơi online.
 */
export function getSocket(): GameSocket {
  socket ??= io({ autoConnect: false });
  return socket;
}

/** Gửi một yêu cầu rồi chờ máy chủ trả lời; null nếu quá thời gian. */
export function request<R>(send: (done: (res: R) => void) => void, ms = WAIT_MS): Promise<R | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    send((res) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
}

/** Mở kết nối nếu chưa có rồi chờ nối xong; false nếu không nối được trong thời gian chờ. */
export function whenConnected(s: GameSocket, ms = WAIT_MS): Promise<boolean> {
  if (s.connected) return Promise.resolve(true);
  s.connect();
  return new Promise((resolve) => {
    const done = (ok: boolean) => {
      clearTimeout(timer);
      s.off('connect', onConnect);
      resolve(ok);
    };
    const onConnect = () => done(true);
    const timer = setTimeout(() => done(false), ms);
    s.on('connect', onConnect);
  });
}
