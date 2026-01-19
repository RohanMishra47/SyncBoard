import { create } from "zustand";
import { DrawAction, Tool } from "../types";

const MAX_HISTORY = 50; // Limit history to prevent memory issues

interface CanvasStore {
  // Drawing state
  tool: Tool;
  color: string;
  brushSize: number;

  // Connection state
  isConnected: boolean;

  // Action history
  actions: DrawAction[];
  undoneActions: DrawAction[]; // For redo functionality

  // User's own actions (for collaborative undo)
  myActionIndices: number[];

  // Actions
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setIsConnected: (connected: boolean) => void;

  // Local actions (your own drawing)
  addAction: (action: DrawAction) => void;

  // Remote actions (from other users)
  addRemoteAction: (action: DrawAction) => void;

  // History management
  undo: () => DrawAction | null;
  redo: () => DrawAction | null;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Canvas operations
  clearCanvas: () => void;
  setActions: (actions: DrawAction[]) => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Initial state
  tool: "pen",
  color: "#000000",
  brushSize: 3,
  actions: [],
  isConnected: false,
  undoneActions: [],
  myActionIndices: [],

  // State updaters
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setBrushSize: (size) => set({ brushSize: size }),

  // Add local action (your own drawing)
  addAction: (action) =>
    set((state) => {
      const newActions = [...state.actions, action];
      const newIndex = newActions.length - 1;

      return {
        actions: newActions,
        myActionIndices: [...state.myActionIndices, newIndex],
        undoneActions: [], // Clear redo stack when new action is added
      };
    }),

  // Add remote action (from other users)
  addRemoteAction: (action) =>
    set((state) => ({
      actions: [...state.actions, action],
      // Note: Don't add to myActionIndices (not our action)
    })),

  setIsConnected: (connected) => set({ isConnected: connected }),

  // Undo (only your own actions)
  undo: () => {
    const state = get();

    if (state.myActionIndices.length === 0) {
      return null; // Nothing to undo
    }

    // Get the index of the last action we performed
    const lastMyActionIndex =
      state.myActionIndices[state.myActionIndices.length - 1];
    const actionToUndo = state.actions[lastMyActionIndex];

    // Remove this action from the canvas
    const newActions = state.actions.filter(
      (_, idx) => idx !== lastMyActionIndex,
    );

    // Update myActionIndices to reflect the removed action
    const newMyActionIndices = state.myActionIndices
      .slice(0, -1)
      .map((idx) => (idx > lastMyActionIndex ? idx - 1 : idx));

    set({
      actions: newActions,
      myActionIndices: newMyActionIndices,
      undoneActions: [...state.undoneActions, actionToUndo].slice(-MAX_HISTORY),
    });

    return actionToUndo;
  },

  // Redo (restore your own undone action)
  redo: () => {
    const state = get();

    if (state.undoneActions.length === 0) {
      return null; // Nothing to redo
    }

    const actionToRedo = state.undoneActions[state.undoneActions.length - 1];
    const newActions = [...state.actions, actionToRedo];
    const newIndex = newActions.length - 1;

    set({
      actions: newActions,
      myActionIndices: [...state.myActionIndices, newIndex],
      undoneActions: state.undoneActions.slice(0, -1),
    });

    return actionToRedo;
  },

  // Check if undo is available
  canUndo: () => {
    return get().myActionIndices.length > 0;
  },

  // Check if redo is available
  canRedo: () => {
    return get().undoneActions.length > 0;
  },

  // Clear canvas
  clearCanvas: () =>
    set((state) => {
      const clearAction: DrawAction = { type: "clear" };
      const newActions = [...state.actions, clearAction];
      const newIndex = newActions.length - 1;

      return {
        actions: newActions,
        myActionIndices: [...state.myActionIndices, newIndex],
        undoneActions: [],
      };
    }),

  // Set actions (when loading from database)
  setActions: (actions) =>
    set({
      actions,
      myActionIndices: [], // Reset since these are loaded actions
      undoneActions: [],
    }),
}));
