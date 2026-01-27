"use client";

import { Redo2, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useCanvasStore } from "../stores/canvasStore";

export default function UndoRedoIndicator() {
  const [lastAction, setLastAction] = useState<"undo" | "redo" | null>(null);

  useEffect(() => {
    // Subscribe to undo/redo actions
    const unsubscribe = useCanvasStore.subscribe((state, prevState) => {
      if (state.undoneActions.length > prevState.undoneActions.length) {
        setLastAction("undo");
        setTimeout(() => setLastAction(null), 1000);
      } else if (state.undoneActions.length < prevState.undoneActions.length) {
        setLastAction("redo");
        setTimeout(() => setLastAction(null), 1000);
      }
    });

    return unsubscribe;
  }, []);

  if (!lastAction) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
      {lastAction === "undo" ? (
        <>
          <Undo2 size={16} />
          <span className="font-medium">Undo</span>
        </>
      ) : (
        <>
          <Redo2 size={16} />
          <span className="font-medium">Redo</span>
        </>
      )}
    </div>
  );
}
