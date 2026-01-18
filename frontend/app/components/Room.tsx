"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useCanvasStore } from "../stores/canvasStore";
import { useRoomStore } from "../stores/roomStore";
import { useSocketStore } from "../stores/socketStore";
import { useUserStore } from "../stores/userStore";

import { ConnectedUser, DrawAction, User } from "../types";

import Canvas from "./Canvas";
import OnlineUsers from "./OnlineUsers";
import Toolbar from "./Toolbar";
import UserCursors from "./UserCursors";

import axios from "axios";
import { Check, Copy } from "lucide-react";
import { API_URL } from "../utils/api";

interface RoomProps {
  slug: string;
}

export default function Room({ slug }: RoomProps) {
  const router = useRouter();

  // Socket and user stores
  const { socket, roomId, isConnected, initializeSocket } = useSocketStore();
  const user = useUserStore((state) => state.user);
  const addRemoteAction = useCanvasStore((state) => state.addRemoteAction);
  const setIsConnected = useCanvasStore((state) => state.setIsConnected);

  // Room store
  const room = useRoomStore((state) => state.room);
  const setRoom = useRoomStore((state) => state.setRoom);
  const setConnectedUsers = useRoomStore((state) => state.setConnectedUsers);
  const updateUserCursor = useRoomStore((state) => state.updateUserCursor);
  const setActions = useCanvasStore((state) => state.setActions);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Ref to track if user has joined the room
  const hasJoinedRoom = useRef(false);

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket();
  }, [initializeSocket]);

  // Update canvas connection status
  useEffect(() => {
    setIsConnected(isConnected);
  }, [isConnected, setIsConnected]); // This isConnected comes from socket store

  // Fetch room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/rooms/${slug}`);

        const fetchedRoom = res.data.room;
        setRoom(fetchedRoom);

        if (fetchedRoom.canvasData?.actions) {
          setActions(fetchedRoom.canvasData.actions);
        }

        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError("Room not found");
        setIsLoading(false);
      }
    };

    fetchRoom();
  }, [slug, setRoom, setActions]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !user) return;

    // Join room on initial connection
    if (socket.connected && !hasJoinedRoom.current) {
      socket.emit("join:room", { roomId, user });
      hasJoinedRoom.current = true;
    }

    // Event handlers
    const handleReconnect = () => {
      hasJoinedRoom.current = false;
      socket.emit("join:room", { roomId, user });
      hasJoinedRoom.current = true;
    };

    const handleDrawAction = (action: DrawAction) => {
      addRemoteAction(action);
    };

    const handleUserJoined = (newUser: User) => {
      console.log("👋 User joined:", newUser.name);
    };

    const handleUserLeft = (leftUser: User) => {
      console.log("👋 User left:", leftUser.name);
    };

    const handleRoomUsers = (users: ConnectedUser[]) => {
      setConnectedUsers(users);
    };

    const handleCursorMove = ({
      userId,
      position,
    }: {
      userId: string;
      position: { x: number; y: number };
    }) => {
      updateUserCursor(userId, position.x, position.y);
    };

    // Register event listeners
    socket.on("connect", handleReconnect);
    socket.on("draw:action", handleDrawAction);
    socket.on("user:joined", handleUserJoined);
    socket.on("user:left", handleUserLeft);
    socket.on("room:users", handleRoomUsers);
    socket.on("cursor:move", handleCursorMove);

    // Cleanup on unmount
    return () => {
      socket.off("connect", handleReconnect);
      socket.off("draw:action", handleDrawAction);
      socket.off("user:joined", handleUserJoined);
      socket.off("user:left", handleUserLeft);
      socket.off("room:users", handleRoomUsers);
      socket.off("cursor:move", handleCursorMove);
    };
  }, [
    socket,
    user,
    roomId,
    addRemoteAction,
    setConnectedUsers,
    updateUserCursor,
  ]);

  const copyRoomLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading UI
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading room...</p>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between">
        <div>
          <h1 className="font-semibold">{room?.name}</h1>
          <p className="text-sm text-gray-400">
            Created by {room?.createdBy?.name}
          </p>
        </div>

        <button
          onClick={copyRoomLink}
          className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Share"}
        </button>
      </div>

      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <Canvas />
          <UserCursors />
        </div>
        <OnlineUsers />
      </div>
    </div>
  );
}
