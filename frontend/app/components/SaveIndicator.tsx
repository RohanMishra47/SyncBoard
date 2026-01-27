"use client";

import { AlertCircle, Check, Cloud, CloudOff } from "lucide-react";
import { useSaveStore } from "../stores/saveStore";

export default function SaveIndicator() {
  const saveStatus = useSaveStore((state) => state.saveStatus);

  // Return if no save status
  if (!saveStatus) return null;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 px-3 py-2 flex items-center gap-2 text-sm">
      {saveStatus === "saved" && (
        <>
          <Check size={16} className="text-green-500" />
          <span className="text-slate-700 font-medium">Saved</span>
        </>
      )}

      {saveStatus === "saving" && (
        <>
          <Cloud size={16} className="text-blue-500 animate-pulse" />
          <span className="text-slate-700 font-medium">Saving...</span>
        </>
      )}

      {saveStatus === "unsaved" && (
        <>
          <CloudOff size={16} className="text-orange-500" />
          <span className="text-slate-700 font-medium">Unsaved</span>
        </>
      )}

      {saveStatus === "error" && (
        <>
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-red-600 font-medium">Save failed</span>
        </>
      )}
    </div>
  );
}
