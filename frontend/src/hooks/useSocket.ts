// socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const useSocket = () => {
  if (!socket) {
    socket = io("http://localhost:3000"); // Replace with your backend URL
  }
  return socket;
};