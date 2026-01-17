"use client";

import { useEffect, useRef } from "react";
import { useCanvasStore } from "../stores/canvasStore";
import { useSocketStore } from "../stores/socketStore";
import { useUserStore } from "../stores/userStore";
import { DrawAction, User } from "../types";
import Canvas from "./Canvas";
import Toolbar from "./Toolbar";

export default function Room() {
  const { socket, roomId, isConnected, initializeSocket } = useSocketStore();
  const user = useUserStore((state) => state.user);
  const addRemoteAction = useCanvasStore((state) => state.addRemoteAction);
  const setIsConnected = useCanvasStore((state) => state.setIsConnected);
  const hasJoinedRoom = useRef(false);

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket();
  }, [initializeSocket]);

  // Update canvas store connection status
  useEffect(() => {
    setIsConnected(isConnected);
  }, [isConnected, setIsConnected]); // This isConnected comes from useSocketStore

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
      <Toolbar />
      <div className="flex-1 overflow-hidden">
        <Canvas />
      </div>
    </div>
  );
}
