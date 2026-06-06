/**
 * Singleton Socket.IO client. Connect once per session (after auth), close
 * on sign-out. Component code goes through {@link useRealtimeThread} to
 * subscribe to a room — never imports `socket.io-client` directly.
 */
import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentToken: string | null = null;

function originOf(base: string | undefined, fallback: string): string {
  try {
    return new URL(base ?? fallback).origin;
  } catch {
    return fallback;
  }
}

const SOCKET_ORIGIN =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  originOf(process.env.NEXT_PUBLIC_API_BASE_URL, 'http://localhost:5000');

export function connectSocket(token: string): Socket {
  if (socket && currentToken === token) return socket;
  /* Token changed → tear down the old connection. */
  if (socket && currentToken !== token) {
    socket.disconnect();
    socket = null;
  }
  currentToken = token;
  socket = io(SOCKET_ORIGIN, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  currentToken = null;
}
