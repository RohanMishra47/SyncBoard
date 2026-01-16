"use client";

import JoinScreen from "./components/JoinScreen";
import Room from "./components/Room";
import { useUserStore } from "./stores/userStore";

export default function Home() {
  const user = useUserStore((state) => state.user);

  // Using a default room ID for now but add proper room creation/joining later
  const defaultRoomId = "default-room";

  if (!user) {
    return <JoinScreen onJoin={useUserStore.getState().setUser} />;
  }

  return <Room roomId={defaultRoomId} />;
}
