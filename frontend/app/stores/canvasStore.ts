import { create } from "zustand";
import { DrawAction, Tool } from "../types";
import { useUserStore } from "./userStore";

const MAX_HISTORY = 50; // Limit history to prevent memory issues
const MAX_ACTIONS = 1000; // Max actions to keep in store
const WARNING_THRESHOLD = 0.9; // Warn when actions reach 90% of max

interface CanvasStore {
  // Drawing state
  tool: Tool;
  color: string;
  brushSize: number;

  // Connection state
  isConnected: boolean;

  // Limit tracking
  isApproachingLimit: boolean;

  // Action history
  actions: DrawAction[];
  undoneActions: DrawAction[]; // For redo functionality

  // Track IDs of user's own actions for undo/redo
  myActionIds: string[];

  // Actions
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setIsConnected: (connected: boolean) => void;

  // Local actions (your own drawing)
  addAction: (action: DrawAction) => void;

  // Remote actions (from other users)
  addRemoteAction: (action: DrawAction) => void;

  removeActionById: (actionId: string) => void;

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
  isApproachingLimit: false,
  undoneActions: [],
  myActionIds: [],

  // State updaters
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setBrushSize: (size) => set({ brushSize: size }),

  // Add local action
  addAction: (action) =>
    set((state) => {
      const newActions = [...state.actions, action];
      const newMyActionIds = [...state.myActionIds, action.id];

      // Check if approaching limit
      const isApproaching =
        newActions.length >= MAX_ACTIONS * WARNING_THRESHOLD;

      if (isApproaching && !state.isApproachingLimit) {
        console.warn(
          `⚠️ Canvas approaching action limit: ${newActions.length}/${MAX_ACTIONS}. Older actions will be removed.`,
        );
      }

      // Truncate if exceeding limit
      let truncatedActions = newActions;
      let truncatedMyActionIds = newMyActionIds;

      if (newActions.length > MAX_ACTIONS) {
        const removeCount = newActions.length - MAX_ACTIONS;
        truncatedActions = newActions.slice(removeCount);

        // Remove IDs that no longer exist in truncated actions
        const remainingIds = new Set(truncatedActions.map((a) => a.id));
        truncatedMyActionIds = newMyActionIds.filter((id) =>
          remainingIds.has(id),
        );

        console.warn(
          `🗑️ Canvas limit exceeded. Removed ${removeCount} oldest actions.`,
        );
      }

      return {
        actions: truncatedActions,
        myActionIds: truncatedMyActionIds,
        undoneActions: [], // Clear redo history
        isApproachingLimit: isApproaching,
      };
    }),

  // Add remote action
  addRemoteAction: (action) =>
    set((state) => {
      const existingIndex = state.actions.findIndex((a) => a.id === action.id);

      if (existingIndex !== -1) {
        const newActions = [...state.actions];
        newActions[existingIndex] = action;
        return { actions: newActions };
      }

      const newActions = [...state.actions, action];

      // Check and truncate for remote actions too
      let truncatedActions = newActions;
      let truncatedMyActionIds = state.myActionIds;

      if (newActions.length > MAX_ACTIONS) {
        const removeCount = newActions.length - MAX_ACTIONS;
        truncatedActions = newActions.slice(removeCount);

        const remainingIds = new Set(truncatedActions.map((a) => a.id));
        truncatedMyActionIds = state.myActionIds.filter((id) =>
          remainingIds.has(id),
        );
      }

      const isApproaching =
        truncatedActions.length >= MAX_ACTIONS * WARNING_THRESHOLD;

      return {
        actions: truncatedActions,
        myActionIds: truncatedMyActionIds,
        isApproachingLimit: isApproaching,
      };
    }),

  setIsConnected: (connected) => set({ isConnected: connected }),

  removeActionById: (actionId: string) =>
    set((state) => ({
      actions: state.actions.filter((a) => a.id !== actionId),
      // Don't modify myActionIds - this is a remote removal
    })),

  // Undo (only your own actions)
  undo: () => {
    const state = get();

    if (state.myActionIds.length === 0) {
      return null;
    }

    const lastMyActionId = state.myActionIds[state.myActionIds.length - 1];
    const actionToUndo = state.actions.find((a) => a.id === lastMyActionId);

    if (!actionToUndo) return null;

    const newActions = state.actions.filter((a) => a.id !== lastMyActionId);

    set({
      actions: newActions,
      myActionIds: state.myActionIds.slice(0, -1),
      undoneActions: [...state.undoneActions, actionToUndo].slice(-MAX_HISTORY),
    });

    return actionToUndo;
  },

  // Redo (restore your own undone action)
  redo: () => {
    const state = get();

    if (state.undoneActions.length === 0) {
      return null;
    }

    const actionToRedo = state.undoneActions[state.undoneActions.length - 1];

    set({
      actions: [...state.actions, actionToRedo],
      myActionIds: [...state.myActionIds, actionToRedo.id],
      undoneActions: state.undoneActions.slice(0, -1),
    });

    return actionToRedo;
  },

  // Check if undo is available
  canUndo: () => {
    return get().myActionIds.length > 0;
  },

  // Check if redo is available
  canRedo: () => {
    return get().undoneActions.length > 0;
  },

  // Clear canvas
  clearCanvas: () =>
    set((state) => {
      const clearAction: DrawAction = {
        id: `clear-${Date.now()}-${Math.random()}`,
        type: "clear",
        userId: useUserStore.getState().user?.id,
        timestamp: Date.now(),
      };

      return {
        actions: [...state.actions, clearAction],
        myActionIds: [...state.myActionIds, clearAction.id],
        undoneActions: [],
      };
    }),

  // Set actions (when loading from database)
  setActions: (actions) =>
    set({
      actions,
      myActionIds: [], // Reset since these are loaded actions
      undoneActions: [],
    }),
}));
