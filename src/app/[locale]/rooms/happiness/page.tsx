"use client";

import EmbeddedRoom from "@/components/rooms/EmbeddedRoom";
import { useMessages } from "@/messages/useMessages";


export default function HappinessRoom() {
  const t = useMessages();

  const src = process.env.NEXT_PUBLIC_HAPPINESS_URL ?? "";

  return (
    <EmbeddedRoom
      title={`🌞 ${t.rooms.happiness.title}`}
      iframeTitle={t.rooms.happiness.title}
      src={src}
      openLabel={t.common.openSeparate}
      missingLabel={t.common.notConfigured}
    />
  );
}