"use client";

import { io, type Socket } from "socket.io-client";
import { env } from "@/lib/env";

let socket: Socket | null = null;

export function getSocket(token: string) {
  if (socket && socket.connected) return socket;

  socket = io(env.backendUrl, {
    transports: ["websocket"],
    auth: { token }
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

