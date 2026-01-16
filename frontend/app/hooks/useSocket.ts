import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

// Singleton socket instance - shared across all components
let socketInstance: Socket | null = null;

const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"], // Allow fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
    });

    // Global socket event listeners
    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance?.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  return socketInstance;
};

export function useSocket() {
  const [socket] = useState<Socket>(() => getSocket());
  const [isConnected, setIsConnected] = useState(socket.connected);
  const mountedRef = useRef(true); // Track if component is mounted

  useEffect(() => {
    mountedRef.current = true;

    const handleConnect = () => {
      if (mountedRef.current) {
        setIsConnected(true);
      }
    };

    const handleDisconnect = () => {
      if (mountedRef.current) {
        setIsConnected(false);
      }
    };

    // Listen for connection changes
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      mountedRef.current = false;
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      // DO NOT disconnect the socket here - keep it alive
    };
  }, [socket]);

  return { socket, isConnected };
}

// Export function to manually disconnect (e.g., on logout)
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
