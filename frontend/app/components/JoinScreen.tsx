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
      setError("Failed to connect. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // The background remains a soft, welcoming gradient.
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* The main card with a softer shadow and subtle border for a more refined look. */}
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md border border-slate-200/80">
        {/* Header section with improved typography and spacing. */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Welcome to SyncBoard
          </h1>
          <p className="text-slate-500 mt-2 mb-8">
            Real-time collaborative drawing
          </p>
        </div>

        {/* The form now has more vertical spacing for a less cramped feel. */}
        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Display Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              disabled={isLoading}
              // Redesigned input: softer background, modern focus ring, and consistent corner radius.
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-800 placeholder:text-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            // Redesigned button: uses the richer `indigo` color, has a clear loading state, and smooth transitions.
            className="w-full inline-flex items-center justify-center bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                {/* A simple spinner for a clean loading indicator */}
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Joining...
              </>
            ) : (
              "Join SyncBoard"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
