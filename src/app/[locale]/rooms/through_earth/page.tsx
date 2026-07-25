"use client";

import EmbeddedRoom from "@/components/rooms/EmbeddedRoom";
import { useMessages } from "@/messages/useMessages";

export default function ThroughEarthRoom() {
  const t = useMessages();

  const src = process.env.NEXT_PUBLIC_THROUGH_EARTH_URL ?? "";

  return (
    <EmbeddedRoom
      title={`🌏 ${t.rooms.through_earth.title}`}
      iframeTitle={t.rooms.through_earth.title}
      src={src}
      openLabel={t.common.openSeparate}
      missingLabel={t.common.notConfigured}
    />
  );
}