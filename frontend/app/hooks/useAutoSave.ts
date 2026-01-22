"use client";

import axios from "axios";
import { debounce } from "lodash";
import { useCallback, useEffect, useRef } from "react";
import { useCanvasStore } from "../stores/canvasStore";
import { useRoomStore } from "../stores/roomStore";

const AUTOSAVE_DELAY = 3000; // Save 3 seconds after last action
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function useAutoSave() {
  const room = useRoomStore((state) => state.room);
  const actions = useCanvasStore((state) => state.actions);
  const lastSaveRef = useRef<number>(0);
  const isSavingRef = useRef(false);

  const saveCanvas = useCallback(async () => {
    if (!room || isSavingRef.current) return;

    const currentActionCount = actions.length;

    // Don't save if nothing changed since last save
    if (currentActionCount === lastSaveRef.current) return;

    isSavingRef.current = true;

    try {
      const response = await axios.put(
        `${API_URL}/api/rooms/${room.slug}/canvas`,
        { actions },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = response.data;

      lastSaveRef.current = currentActionCount;
      console.log(`✅ Auto-saved ${data.savedActions} actions`);

      if (data.truncated) {
        console.warn("⚠️ Canvas history truncated to 1000 actions");
      }
    } catch (error) {
      console.error("❌ Auto-save failed:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [room, actions]);

  // Debounced save function
  const debouncedSave = useRef(debounce(saveCanvas, AUTOSAVE_DELAY)).current;

  // Trigger save when actions change
  useEffect(() => {
    if (actions.length > 0) {
      debouncedSave();
    }
  }, [actions, debouncedSave]);

  // Save immediately when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (actions.length > lastSaveRef.current) {
        // Use synchronous fetch for beforeunload
        navigator.sendBeacon(
          `${API_URL}/api/rooms/${room?.slug}/canvas`,
          JSON.stringify({ actions }),
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [actions, room]);

  return {
    saveNow: saveCanvas,
    lastSaved: lastSaveRef.current,
  };
}
