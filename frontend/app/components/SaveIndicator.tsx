"use client";

import { AlertCircle, Check, Cloud, CloudOff } from "lucide-react";
import { useSaveStore } from "../stores/saveStore";

export default function SaveIndicator() {
  const saveStatus = useSaveStore((state) => state.saveStatus);

  return (
    <div className="fixed top-4 right-2/4 bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2 text-sm">
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

      {saveStatus === "unsaved" && (
        <>
          <CloudOff size={16} className="text-orange-500" />
          <span className="text-gray-600">Unsaved changes</span>
        </>
      )}

      {saveStatus === "error" && (
        <>
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-red-600">Save failed</span>
        </>
      )}
    </div>
  );
}
