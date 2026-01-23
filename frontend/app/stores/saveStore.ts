import { create } from "zustand";

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface SaveStore {
  saveStatus: SaveStatus;
  lastSavedCount: number;

  setSaveStatus: (status: SaveStatus) => void;
  setLastSavedCount: (count: number) => void;
}

export const useSaveStore = create<SaveStore>((set) => ({
  saveStatus: "saved",
  lastSavedCount: 0,

  setSaveStatus: (status) => set({ saveStatus: status }),
  setLastSavedCount: (count) => set({ lastSavedCount: count }),
}));
