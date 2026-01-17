"use client";

import { useEffect, useRef } from "react";
import { useSocket } from "../hooks/useSocket";
import { useCanvasStore } from "../stores/canvasStore";
import { useUserStore } from "../stores/userStore";
import { DrawAction, User } from "../types";
import Canvas from "./Canvas";
import Toolbar from "./Toolbar";

interface RoomProps {
  roomId: string;
}

export default function Room({ roomId }: RoomProps) {
  const { socket, isConnected } = useSocket();
  const user = useUserStore((state) => state.user);
  const addRemoteAction = useCanvasStore((state) => state.addRemoteAction);
  const setIsConnected = useCanvasStore((state) => state.setIsConnected);
  const hasJoinedRoom = useRef(false);

  // Update store connection status
  useEffect(() => {
    setIsConnected(isConnected);
  }, [isConnected, setIsConnected]); // This isConnected comes from useSocket

  useEffect(() => {
    if (!socket || !user) return;

    // Only join room once when socket is connected
    if (socket.connected && !hasJoinedRoom.current) {
      console.log(`🚪 Joining room ${roomId} as ${user.name}`);
      socket.emit("join:room", { roomId, user });
      hasJoinedRoom.current = true;
    }

    // If socket reconnects, rejoin the room
    const handleReconnect = () => {
      console.log("🔄 Reconnected, rejoining room");
      hasJoinedRoom.current = false;
      socket.emit("join:room", { roomId, user });
      hasJoinedRoom.current = true;
    };

    // Listen for drawing actions from other users
    const handleDrawAction = (action: DrawAction) => {
      console.log("📥 Received remote action:", action);
      addRemoteAction(action);
    };

    // Listen for user events
    const handleUserJoined = (newUser: User) => {
      console.log("👋 User joined:", newUser.name);
    };

    const handleUserLeft = (leftUser: User) => {
      console.log("👋 User left:", leftUser.name);
    };

    const handleRoomUsers = (users: User[]) => {
      console.log("👥 Room users:", users.map((u) => u.name).join(", "));
    };

    socket.on("connect", handleReconnect);
    socket.on("draw:action", handleDrawAction);
    socket.on("user:joined", handleUserJoined);
    socket.on("user:left", handleUserLeft);
    socket.on("room:users", handleRoomUsers);

    // Cleanup listeners on unmount
    return () => {
      socket.off("connect", handleReconnect);
      socket.off("draw:action", handleDrawAction);
      socket.off("user:joined", handleUserJoined);
      socket.off("user:left", handleUserLeft);
      socket.off("room:users", handleRoomUsers);
    };
  }, [socket, user, roomId, addRemoteAction]);

  return (
    <div className="h-screen flex flex-col">
      <Toolbar socket={socket} roomId={roomId} />
      <div className="flex-1 overflow-hidden">
        <Canvas socket={socket} roomId={roomId} />
      </div>
    </div>
  );
}
