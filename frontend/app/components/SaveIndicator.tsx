"use client";

import { Check, Cloud, CloudOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useCanvasStore } from "../stores/canvasStore";

export default function SaveIndicator() {
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const lastActionCount = useCanvasStore((state) => state.actions.length);
  const isUnsaved = saveStatus === "saved" && lastActionCount > 0;

  useEffect(() => {
    if (lastActionCount === 0) return;

    const timer = setTimeout(() => {
      setSaveStatus("saving");

      const saveTimer = setTimeout(() => {
        setSaveStatus("saved");
      }, 500);

      return () => clearTimeout(saveTimer);
    }, 3000);

    return () => clearTimeout(timer);
  }, [lastActionCount]);

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2 text-sm">
      {saveStatus === "saved" && (
        <>
          <Check size={16} className="text-green-500" />
          <span className="text-gray-600">Saved</span>
        </>
      )}
      {saveStatus === "saving" && (
        <>
          <Cloud size={16} className="text-blue-500 animate-pulse" />
          <span className="text-gray-600">Saving...</span>
        </>
      )}
      {isUnsaved && (
        <>
          <CloudOff size={16} className="text-gray-400" />
          <span className="text-gray-400">Unsaved changes</span>
        </>
      )}
    </div>
  );
}
