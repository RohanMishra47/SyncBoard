"use client";

import JoinScreen from "@/app/components/JoinScreen";
import Room from "@/app/components/Room";
import { useUserStore } from "@/app/stores/userStore";
import { use } from "react";

export default function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  if (!user) {
    return (
      <JoinScreen
        onJoin={(user) => {
          setUser(user);
          // Stay on the same page after joining
        }}
      />
    );
  }

  return <Room slug={slug} />;
}
