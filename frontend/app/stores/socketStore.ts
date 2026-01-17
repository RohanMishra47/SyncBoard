import { io, Socket } from "socket.io-client";
import { create } from "zustand";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

interface SocketStore {
  roomId: string | null;
  socket: Socket | null;
  isConnected: boolean;

  // Actions
  setRoomId: (roomId: string) => void;
  initializeSocket: () => void;
  disconnectSocket: () => void;
  setIsConnected: (connected: boolean) => void;
}

// Singleton socket instance
let socketInstance: Socket | null = null;

export const useSocketStore = create<SocketStore>((set) => ({
  roomId: null,
  socket: null,
  isConnected: false,

  setRoomId: (roomId) => set({ roomId }),

  initializeSocket: () => {
    // Only create socket once
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        autoConnect: true,
      });

      // Global socket event listeners
      socketInstance.on("connect", () => {
        console.log("✅ Socket connected:", socketInstance?.id);
        set({ isConnected: true });
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
        set({ isConnected: false });
      });

      socketInstance.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      set({ socket: socketInstance });
    } else {
      // Socket already exists, just update state
      set({
        socket: socketInstance,
        isConnected: socketInstance.connected,
      });

      // Connect if not already connected
      if (!socketInstance.connected) {
        socketInstance.connect();
      }
    }
  },

  disconnectSocket: () => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      set({ socket: null, isConnected: false });
    }
  },

  setIsConnected: (connected) => set({ isConnected: connected }),
}));
