"use client";

import { Users } from "lucide-react";
import { useRoomStore } from "../stores/roomStore";
import { useUserStore } from "../stores/userStore";

export default function OnlineUsers() {
  const connectedUsers = useRoomStore((state) => state.connectedUsers);
  const currentUser = useUserStore((state) => state.user);

  return (
    <div className="bg-white border-l border-gray-200 p-4 w-64">
      <div className="flex items-center gap-2 mb-4">
        <Users size={20} className="text-gray-600" />
        <h3 className="font-semibold text-gray-800">
          Online ({connectedUsers.length})
        </h3>
      </div>

      <div className="space-y-2">
        {connectedUsers.map((user) => (
          <div
            key={user.socketId}
            className="flex items-center gap-2 p-2 rounded bg-gray-50"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">
              {user.name}
              {user.id === currentUser?.id && (
                <span className="text-gray-400 ml-1">(you)</span>
              )}
            </span>
          </div>
        ))}

        {connectedUsers.length === 0 && (
          <p className="text-sm text-gray-500">No users online</p>
        )}
      </div>
    </div>
  );
}
