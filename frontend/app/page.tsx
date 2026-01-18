"use client";

import JoinScreen from "./components/JoinScreen";
import RoomSelect from "./components/RoomSelect";
import { useUserStore } from "./stores/userStore";

export default function Home() {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return <JoinScreen onJoin={useUserStore.getState().setUser} />;
  }

  return <RoomSelect />;
}
