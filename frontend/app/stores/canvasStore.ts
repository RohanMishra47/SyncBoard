import { create } from "zustand";
import { DrawAction, Tool } from "../types";

interface CanvasStore {
  // Canvas state
  tool: Tool;
  color: string;
  brushSize: number;
  actions: DrawAction[];

  // Actions
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  addAction: (action: DrawAction) => void;
  clearCanvas: () => void;
  setActions: (actions: DrawAction[]) => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  // Initial state
  tool: "pen",
  color: "#000000",
  brushSize: 3,
  actions: [],

  // State updaters
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setBrushSize: (size) => set({ brushSize: size }),

  addAction: (action) =>
    set((state) => ({
      actions: [...state.actions, action],
    })),

  clearCanvas: () =>
    set((state) => ({
      actions: [...state.actions, { type: "clear" }],
    })),

  setActions: (actions) => set({ actions }),
}));
