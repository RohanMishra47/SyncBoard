"use client";

import { useState } from "react";
import Canvas from "./components/Canvas";
import JoinScreen from "./components/JoinScreen";
import Toolbar from "./components/Toolbar";
import { User } from "./types";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

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
