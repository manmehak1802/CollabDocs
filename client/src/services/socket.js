import { io } from 'socket.io-client';

export const connectSocket = () =>
  io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token: localStorage.getItem('token') },
  });