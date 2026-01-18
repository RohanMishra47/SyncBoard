"use client";

import { MousePointer2 } from "lucide-react";
import { useRoomStore } from "../stores/roomStore";
import { useUserStore } from "../stores/userStore";

export default function UserCursors() {
  const connectedUsers = useRoomStore((state) => state.connectedUsers);
  const currentUser = useUserStore((state) => state.user);

  // Filter out current user and users without cursor positions
  const otherUserCursors = connectedUsers.filter(
    (user) => user.id !== currentUser?.id && user.cursor,
  );

  return (
    <>
      {otherUserCursors.map((user) => (
        <div
          key={user.socketId}
          className="absolute pointer-events-none transition-all duration-100"
          style={{
            left: user.cursor!.x,
            top: user.cursor!.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <MousePointer2
            size={24}
            className="text-blue-500 drop-shadow-lg"
            fill="currentColor"
          />
          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded mt-1 whitespace-nowrap">
            {user.name}
          </div>
        </div>
      ))}
    </>
  );
}
