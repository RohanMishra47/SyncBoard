import { create } from "zustand";
import { DrawAction, Tool } from "../types";

interface CanvasStore {
  // Local drawing state
  tool: Tool;
  color: string;
  brushSize: number;

  // Action history
  actions: DrawAction[];

  // Connection state
  isConnected: boolean;

  // Actions
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  addAction: (action: DrawAction) => void;
  addRemoteAction: (action: DrawAction) => void;
  clearCanvas: () => void;
  setActions: (actions: DrawAction[]) => void;
  setIsConnected: (connected: boolean) => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  // Initial state
  tool: "pen",
  color: "#000000",
  brushSize: 3,
  actions: [],
  isConnected: false,

  // State updaters
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setBrushSize: (size) => set({ brushSize: size }),

  // Add local action (your own drawing)
  addAction: (action) =>
    set((state) => ({
      actions: [...state.actions, action],
    })),

  // Add remote action (from other users)
  addRemoteAction: (action) =>
    set((state) => ({
      actions: [...state.actions, action],
    })),

  clearCanvas: () =>
    set((state) => ({
      actions: [...state.actions, { type: "clear" }],
    })),

  setActions: (actions) => set({ actions }),

  setIsConnected: (connected) => set({ isConnected: connected }),
}));
