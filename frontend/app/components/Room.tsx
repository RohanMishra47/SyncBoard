"use client";

import axios from "axios";
import { Check, Copy, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Stores
import { useCanvasStore } from "../stores/canvasStore";
import { useRoomStore } from "../stores/roomStore";
import { useSocketStore } from "../stores/socketStore";
import { useUserStore } from "../stores/userStore";

// Types
import { ConnectedUser, DrawAction } from "../types";

// Hooks
import { useAutoSave } from "../hooks/useAutoSave";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

// Components
import Canvas from "./Canvas";
import OnlineUsers from "./OnlineUsers";
import SaveIndicator from "./SaveIndicator";
import Toolbar from "./Toolbar";
import UndoRedoIndicator from "./UndoRedoIndicator";
import UserCursors from "./UserCursors";

// Utils
import { API_URL } from "../utils/api";

interface RoomProps {
  slug: string;
}

export default function Room({ slug }: RoomProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  // Stores
  const { socket, roomId, isConnected, initializeSocket, setRoomId } =
    useSocketStore();
  const user = useUserStore((state) => state.user);
  const { addRemoteAction, setActions, removeActionById, setIsConnected } =
    useCanvasStore();
  const { room, setRoom, setConnectedUsers, updateUserCursor } = useRoomStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const hasJoinedRoom = useRef(false);

  // Custom Hooks
  useKeyboardShortcuts();
  useAutoSave();

  // --- LOGIC (UNCHANGED) ---

  useEffect(() => {
    setRoomId(slug);
  }, [slug, setRoomId]);

  useEffect(() => {
    initializeSocket();
  }, [initializeSocket]);

  useEffect(() => {
    setIsConnected(isConnected);
  }, [isConnected, setIsConnected]);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/rooms/${slug}`);
        const fetchedRoom = res.data.room;
        setRoom(fetchedRoom);
        if (fetchedRoom.canvasData?.actions) {
          setActions(fetchedRoom.canvasData.actions);
        }
      } catch (err) {
        console.error(err);
        setError(
          "Room not found. It may have been deleted or the link is incorrect.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoom();
  }, [slug, setRoom, setActions]);

  useEffect(() => {
    if (!socket || !user || !roomId) return;
    if (socket.connected && !hasJoinedRoom.current) {
      socket.emit("join:room", { roomId, user });
      hasJoinedRoom.current = true;
    }

    const handleReconnect = () => {
      hasJoinedRoom.current = false; // Reset to allow re-joining
      socket.emit("join:room", { roomId, user });
      hasJoinedRoom.current = true;
    };
    const handleDrawAction = (action: DrawAction) => addRemoteAction(action);
    const handleRoomUsers = (users: ConnectedUser[]) =>
      setConnectedUsers(users);
    const handleCursorMove = ({
      userId,
      position,
    }: {
      userId: string;
      position: { x: number; y: number };
    }) => updateUserCursor(userId, position.x, position.y);
    const handleRemoteUndo = (action: DrawAction) =>
      removeActionById(action.id);

    const eventListeners = {
      connect: handleReconnect,
      "draw:action": handleDrawAction,
      "room:users": handleRoomUsers,
      "cursor:move": handleCursorMove,
      "draw:undo": handleRemoteUndo,
    };
    Object.entries(eventListeners).forEach(([event, handler]) =>
      socket.on(event, handler),
    );

    return () => {
      Object.entries(eventListeners).forEach(([event, handler]) =>
        socket.off(event, handler),
      );
    };
  }, [
    socket,
    user,
    roomId,
    addRemoteAction,
    setConnectedUsers,
    updateUserCursor,
    removeActionById,
  ]);

  // --- END LOGIC ---

  const copyRoomLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-slate-600 font-medium">Loading SyncBoard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-slate-200 w-full max-w-md">
          <h2 className="text-xl font-bold text-slate-800">
            Something went wrong
          </h2>
          <p className="text-red-600 mt-2 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <Home size={18} />
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100">
      {/* Header Section */}
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-4 z-20 shrink-0">
        <div className="min-w-0">
          <h1
            className="text-lg font-bold text-slate-800 truncate"
            title={room?.name}
          >
            {room?.name}
          </h1>
          <p className="text-xs text-slate-500">
            Created by {room?.createdBy?.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all active:scale-95"
          >
            {copied ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Copy size={16} />
            )}
            {copied ? "Copied!" : "Share"}
          </button>
          <OnlineUsers />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Canvas and Overlays */}
        <div className="h-full w-full">
          <Canvas ref={canvasRef} />
          <UserCursors />
        </div>

        {/* Toolbar */}
        {/* Note: The Toolbar component should be a flex container. It will be vertical on desktop (`flex-col`) and horizontal on mobile (`flex-row`). */}
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 z-10 p-2 bg-white rounded-lg shadow-lg border border-slate-200 
                        md:flex md:flex-col md:gap-2
                        hidden"
        >
          <Toolbar canvasRef={canvasRef} />
        </div>
        {/* Mobile Toolbar at the bottom */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 p-2 bg-white rounded-lg shadow-lg border border-slate-200
                        flex gap-2 md:hidden"
        >
          <Toolbar canvasRef={canvasRef} />
        </div>

        {/* Status Indicators */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
          <UndoRedoIndicator />
          <SaveIndicator />
        </div>
      </main>
    </div>
  );
}
