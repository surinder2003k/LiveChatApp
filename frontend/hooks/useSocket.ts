"use client";

import * as React from "react";
import type { Socket } from "socket.io-client";

import { getSocket, disconnectSocket } from "@/lib/socket";

export function useSocket(token: string | null) {
  const [socket, setSocket] = React.useState<Socket | null>(null);

  React.useEffect(() => {
    if (!token) {
      disconnectSocket();
      setSocket(null);
      return;
    }

    const s = getSocket(token);
    setSocket(s);

    return () => {
      // keep socket alive across route changes; explicit disconnect on logout
    };
  }, [token]);

  return socket;
}

