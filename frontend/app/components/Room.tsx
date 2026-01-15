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
  const socket = useSocket();
  const user = useUserStore((state) => state.user);
  const addRemoteAction = useCanvasStore((state) => state.addRemoteAction);
  const setIsConnected = useCanvasStore((state) => state.setIsConnected);
  const hasJoinedRoom = useRef(false);

  useEffect(() => {
    if (!socket || !user || hasJoinedRoom.current) return;

    // Join the room
    socket.emit("join:room", { roomId, user });
    hasJoinedRoom.current = true;

    // Listen for connection status
    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // Listen for drawing actions from other users
    const handleDrawAction = (action: DrawAction) => {
      console.log("Received remote action:", action);
      addRemoteAction(action);
    };

    // Listen for user events
    const handleUserJoined = (newUser: User) => {
      console.log("User joined:", newUser);
    };

    const handleUserLeft = (leftUser: User) => {
      console.log("User left:", leftUser);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("draw:action", handleDrawAction);
    socket.on("user:joined", handleUserJoined);
    socket.on("user:left", handleUserLeft);

    // Cleanup on unmount
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("draw:action", handleDrawAction);
      socket.off("user:joined", handleUserJoined);
      socket.off("user:left", handleUserLeft);
    };
  }, [socket, user, roomId, addRemoteAction, setIsConnected]);

  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 overflow-hidden">
        <Canvas socket={socket} roomId={roomId} />
      </div>
    </div>
  );
}
