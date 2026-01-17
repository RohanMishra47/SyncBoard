"use client";

import { useEffect } from "react";
import JoinScreen from "./components/JoinScreen";
import Room from "./components/Room";
import { useSocketStore } from "./stores/socketStore";
import { useUserStore } from "./stores/userStore";

export default function Home() {
  const user = useUserStore((state) => state.user);
  const setRoomId = useSocketStore((state) => state.setRoomId);

  // Set default room ID on mount
  useEffect(() => {
    setRoomId("default-room"); // Using a default room ID for now but add proper room creation/joining later
  }, [setRoomId]);

  if (!user) {
    return <JoinScreen onJoin={useUserStore.getState().setUser} />;
  }

  return <Room />;
}
