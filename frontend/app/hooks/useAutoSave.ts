"use client";

import axios from "axios";
import { useCallback, useEffect, useRef } from "react";
import { simplifyDrawAction } from "../lib/simplifyPath";
import { useCanvasStore } from "../stores/canvasStore";
import { useRoomStore } from "../stores/roomStore";
import { useSaveStore } from "../stores/saveStore";

const AUTOSAVE_DELAY = 3000; // Save 3 seconds after last action
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function useAutoSave() {
  const room = useRoomStore((state) => state.room);
  const actions = useCanvasStore((state) => state.actions);

  const { setSaveStatus, lastSavedCount, setLastSavedCount } = useSaveStore();

  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isSavingRef = useRef(false);

  // Actual save function
  const performSave = useCallback(async () => {
    if (!room || isSavingRef.current) {
      console.log("⏭️ Skipping save:", {
        hasRoom: !!room,
        isSaving: isSavingRef.current,
      });
      return;
    }

    const currentActionCount = actions.length;

    // Don't save if nothing changed since last save
    if (currentActionCount === lastSavedCount) {
      console.log("⏭️ No changes to save");
      return;
    }

    isSavingRef.current = true;
    setSaveStatus("saving");

    console.log(`💾 Saving ${currentActionCount} actions...`);

    try {
      // Simplify actions before sending
      const simplifiedActions = actions.map((action) =>
        simplifyDrawAction(action),
      );

      const response = await axios.put(
        `${API_URL}/api/rooms/${room.slug}/canvas`,
        { actions: simplifiedActions },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = response.data;

      setLastSavedCount(currentActionCount);
      setSaveStatus("saved");

      console.log(`✅ Auto-saved ${data.savedActions} actions`);

      if (data.truncated) {
        console.warn("⚠️ Canvas history truncated to 1000 actions");
      }
    } catch (error) {
      console.error("❌ Auto-save failed:", error);
      setSaveStatus("error");

      // Retry after 5 seconds on error
      setTimeout(() => {
        isSavingRef.current = false;
        performSave();
      }, 5000);
    } finally {
      isSavingRef.current = false;
    }
  }, [room, actions, lastSavedCount, setSaveStatus, setLastSavedCount]);

  // Trigger save when actions change
  useEffect(() => {
    if (actions.length === 0) return;

    // Mark as unsaved immediately when actions change
    if (actions.length !== lastSavedCount) {
      setSaveStatus("unsaved");
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule new save
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, AUTOSAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [actions.length, lastSavedCount, performSave, setSaveStatus]);

  // Save immediately when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (actions.length > lastSavedCount && room) {
        // Show warning if there are unsaved changes
        e.preventDefault();
        e.returnValue = "";

        // Attempt synchronous save using sendBeacon
        const blob = new Blob([JSON.stringify({ actions })], {
          type: "application/json",
        });

        const sent = navigator.sendBeacon(
          `${API_URL}/api/rooms/${room.slug}/canvas`,
          blob,
        );

        console.log(sent ? "📤 Beacon sent" : "❌ Beacon failed");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [actions, lastSavedCount, room]);

  return {
    saveNow: performSave,
  };
}
