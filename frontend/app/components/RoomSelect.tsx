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
    try {
      const url = new URL(trimmed);
      const pathParts = url.pathname.split("/");
      const roomIndex = pathParts.indexOf("room");
      if (roomIndex !== -1 && pathParts[roomIndex + 1]) {
        return pathParts[roomIndex + 1];
      }
    } catch {
      /* Not a valid URL */
    }
    if (trimmed.startsWith("/room/")) {
      return trimmed.replace("/room/", "");
    }
    return trimmed;
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinSlug.trim()) {
      setError("Please enter a room code or link");
      return;
    }
    setIsJoining(true);
    setError("");
    try {
      const slug = extractSlugFromInput(joinSlug);
      if (!slug) {
        setError("Invalid room code or URL");
        setIsJoining(false);
        return;
      }
      await axios.get(`${API_URL}/api/rooms/${slug}`);
      router.push(`/room/${slug}`);
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.status === 404) {
        setError("Room not found. Please check the code and try again.");
      } else {
        setError("Failed to join room. Please try again.");
      }
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-lg border border-slate-200/80 p-6 sm:p-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-linear-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
            SyncBoard
          </h1>
          <p className="mt-2 text-slate-500">
            Welcome,{" "}
            <span className="font-medium text-slate-700">{user?.name}</span>!
          </p>
        </div>

        {/* Main content grid with a central divider on medium screens and up */}
        <div className="grid gap-8 md:grid-cols-2 md:gap-0 md:divide-x md:divide-slate-200">
          {/* Create Room Section */}
          <div className="space-y-6 md:pr-8">
            <h2 className="flex items-center gap-3 text-xl font-semibold text-slate-800">
              <Plus size={22} className="text-indigo-500" />
              Create a New Room
            </h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label
                  htmlFor="room-name"
                  className="mb-1.5 block text-sm font-medium text-slate-600"
                >
                  Room Name
                </label>
                <input
                  id="room-name"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g., Design Brainstorm"
                  disabled={isCreating}
                  className="w-full rounded-md border-slate-300 bg-slate-100 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating && (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {isCreating ? "Creating..." : "Create Room"}
              </button>
            </form>
          </div>

          {/* Join Room Section */}
          <div className="space-y-6 md:pl-8">
            <h2 className="flex items-center gap-3 text-xl font-semibold text-slate-800">
              <ArrowRight size={22} className="text-slate-500" />
              Join an Existing Room
            </h2>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label
                  htmlFor="join-slug"
                  className="mb-1.5 block text-sm font-medium text-slate-600"
                >
                  Room Code or Link
                </label>
                <input
                  id="join-slug"
                  type="text"
                  value={joinSlug}
                  onChange={(e) => setJoinSlug(e.target.value)}
                  placeholder="Paste code or link here"
                  disabled={isJoining}
                  className="w-full rounded-md border-slate-300 bg-slate-100 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={isJoining}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-slate-700 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {isJoining && (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {isJoining ? "Joining..." : "Join Room"}
              </button>
            </form>
          </div>
        </div>

        {/* Global Error Message */}
        {error && (
          <div className="mt-8 rounded-md bg-red-50 p-4 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
