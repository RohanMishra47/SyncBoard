"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { getSavedUserId, getSavedUserName, saveUser } from "../lib/auth";
import { User } from "../types";
import { API_URL } from "../utils/api";

interface JoinScreenProps {
  onJoin: (user: User) => void;
}

export default function JoinScreen({ onJoin }: JoinScreenProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Pre-fill with saved name if exists
    const savedName = getSavedUserName();
    if (savedName) {
      setName(savedName);
    }
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const savedUserId = getSavedUserId();

      const response = await axios.post(`${API_URL}/api/auth/join`, {
        name: name.trim(),
        userId: savedUserId,
      });

      const { user } = response.data;

      // Save to localStorage
      saveUser(user.id, user.name);

      // Notify parent component
      onJoin(user);
    } catch (err) {
      setError("Failed to connect. Make sure the server is running.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">SyncBoard</h1>
        <p className="text-gray-600 mb-6">Real-time collaborative drawing</p>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Joining..." : "Join SyncBoard"}
          </button>
        </form>
      </div>
    </div>
  );
}
