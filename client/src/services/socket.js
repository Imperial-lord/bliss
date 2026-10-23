import { io } from 'socket.io-client';
import { SERVER_URL } from '../config/webrtc';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}
