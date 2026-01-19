"use client";

import axios, { AxiosError } from "axios";
import { ArrowRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUserStore } from "../stores/userStore";
import { API_URL } from "../utils/api";

export default function RoomSelect() {
  const [roomName, setRoomName] = useState("");
  const [joinSlug, setJoinSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const user = useUserStore((state) => state.user);
  const router = useRouter();

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomName.trim()) {
      setError("Please enter a room name");
      return;
    }

    if (!user) {
      setError("User not authenticated");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const response = await axios.post(`${API_URL}/api/rooms/create`, {
        name: roomName.trim(),
        userId: user.id,
      });

      const { room } = response.data;

      // Navigate to the new room
      router.push(`/room/${room.slug}`);
    } catch (err) {
      setError("Failed to create room. Please try again.");
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const extractSlugFromInput = (input: string): string => {
    const trimmed = input.trim();

    // Check if it's a full URL
    try {
      const url = new URL(trimmed);
      // Extract slug from pathname: /room/slug-here -> slug-here
      const pathParts = url.pathname.split("/");
      const roomIndex = pathParts.indexOf("room");
      if (roomIndex !== -1 && pathParts[roomIndex + 1]) {
        return pathParts[roomIndex + 1];
      }
    } catch {
      // Not a valid URL, treat as slug
    }

    // Check if it's a path like "/room/slug-here"
    if (trimmed.startsWith("/room/")) {
      return trimmed.replace("/room/", "");
    }

    // Otherwise, treat as direct slug
    return trimmed;
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!joinSlug.trim()) {
      setError("Please enter a room code");
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      // Extract slug from whatever format user provided
      const slug = extractSlugFromInput(joinSlug);

      if (!slug) {
        setError("Invalid room code or URL");
        setIsJoining(false);
        return;
      }

      // Verify room exists before navigating
      await axios.get(`${API_URL}/api/rooms/${slug}`);

      // Room exists, navigate to it
      router.push(`/room/${slug}`);
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.status === 404) {
        setError("Room not found. Please check the room code and try again.");
      } else {
        setError("Failed to join room. Please try again.");
      }
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">SyncBoard</h1>
          <p className="text-gray-600">Welcome, {user?.name}!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Room */}
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Plus size={24} />
              Create Room
            </h2>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label
                  htmlFor="room-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Room Name
                </label>
                <input
                  id="room-name"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g., Design Brainstorm"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isCreating}
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? "Creating..." : "Create Room"}
              </button>
            </form>
          </div>

          {/* Join Room */}
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ArrowRight size={24} />
              Join Room
            </h2>

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label
                  htmlFor="join-slug"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Room Code
                </label>
                <input
                  id="join-slug"
                  type="text"
                  value={joinSlug}
                  onChange={(e) => setJoinSlug(e.target.value)}
                  placeholder="Paste room link or code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isJoining}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Get the room code from the &quot;Share&quot; button in an
                  active room
                </p>
              </div>

              <button
                type="submit"
                disabled={isJoining}
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isJoining ? "Joining..." : "Join Room"}
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
