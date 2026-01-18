import { create } from "zustand";
import { ConnectedUser, Room } from "../types";

// Define the shape of the room store
interface RoomStore {
  room: Room | null;
  connectedUsers: ConnectedUser[];

  setRoom: (room: Room | null) => void;
  setConnectedUsers: (users: ConnectedUser[]) => void;
  addUser: (user: ConnectedUser) => void;
  removeUser: (socketId: string) => void;
  updateUserCursor: (userId: string, x: number, y: number) => void;
}

// Create the room store using Zustand
export const useRoomStore = create<RoomStore>((set) => ({
  room: null,
  connectedUsers: [],

  setRoom: (room) => set({ room }),

  setConnectedUsers: (users) => set({ connectedUsers: users }),

  addUser: (user) =>
    set((state) => ({
      connectedUsers: [...state.connectedUsers, user],
    })),

  removeUser: (socketId) =>
    set((state) => ({
      connectedUsers: state.connectedUsers.filter(
        (u) => u.socketId !== socketId,
      ),
    })),

  updateUserCursor: (userId, x, y) =>
    set((state) => ({
      connectedUsers: state.connectedUsers.map((u) =>
        u.id === userId ? { ...u, cursor: { x, y } } : u,
      ),
    })),
}));
