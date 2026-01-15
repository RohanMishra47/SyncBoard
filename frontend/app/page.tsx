"use client";

import Canvas from "./components/Canvas";
import JoinScreen from "./components/JoinScreen";
import Toolbar from "./components/Toolbar";
import { useUserStore } from "./stores/userStore";

export default function Home() {
  const { user, setUser } = useUserStore();

  if (!user) {
    return <JoinScreen onJoin={setUser} />;
  }

  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 overflow-hidden">
        <Canvas />
      </div>
    </div>
  );
}
