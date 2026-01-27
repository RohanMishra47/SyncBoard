"use client";

import { ChevronLeft, Users, X } from "lucide-react";
import { useState } from "react";
import { useRoomStore } from "../stores/roomStore";
import { useUserStore } from "../stores/userStore";

export default function OnlineUsers() {
  const connectedUsers = useRoomStore((state) => state.connectedUsers);
  const currentUser = useUserStore((state) => state.user);

  const [isOpen, setIsOpen] = useState(false); // mobile + desktop collapse

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          md:hidden
          fixed right-4 top-20 z-40
          rounded-full p-3
          bg-blue-600 text-white
          shadow-lg
        "
      >
        <Users size={18} />
      </button>

      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`
          fixed top-0 right-0 z-40 h-full
          bg-white/80 backdrop-blur-xl
          border-l border-gray-200
          shadow-xl
          transition-all duration-300 ease-in-out
          
          ${isOpen ? "translate-x-0 w-72" : "translate-x-full md:translate-x-0 md:w-16"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Users size={18} />
            </div>
            <span
              className={`font-semibold text-gray-800 transition-opacity ${
                isOpen ? "opacity-100" : "opacity-0 md:hidden"
              }`}
            >
              Online ({connectedUsers.length})
            </span>
          </div>

          {/* Close / Collapse */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            {isOpen ? <X size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Users */}
        <div
          className={`
              flex-1 px-3 py-4 space-y-2
              ${isOpen ? "overflow-y-scroll" : "overflow-hidden"}
            `}
        >
          {connectedUsers.map((user) => (
            <div
              key={user.socketId}
              className="
                flex items-center gap-3
                rounded-xl px-3 py-2
                bg-white/80 border border-gray-100
                shadow-sm
              "
            >
              {/* Status */}
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-40" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>

              {/* Name */}
              {isOpen && (
                <span className="text-sm font-medium text-gray-700 truncate">
                  {user.name}
                  {user.id === currentUser?.id && (
                    <span className="ml-1 text-xs text-gray-400">(you)</span>
                  )}
                </span>
              )}
            </div>
          ))}

          {connectedUsers.length === 0 && isOpen && (
            <p className="mt-6 text-center text-sm text-gray-500">
              No users online
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
