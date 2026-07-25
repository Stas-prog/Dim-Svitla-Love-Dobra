"use client";

import RoomCard from "@/components/rooms/RoomCard";
import { useMessages } from "@/messages/useMessages";

export default function PlatformsRoom() {
  const t = useMessages();

  const platforms = [
  {
    icon: "▶️",
    title: "YouTube",
    description: t.platforms.items.youtube.description,
    url: "https://youtube.com/@cosmocatsua?si=HG7aS4yu6d0dk1Fg",
  },
  {
    icon: "🎵",
    title: "TikTok",
    description: t.platforms.items.tiktok.description,
    url: "https://tiktok.com/@cosmocats_",
  },
  {
    icon: "💬",
    title: "Telegram",
    description: t.platforms.items.telegram.description,
    url: "https://t.me/CosmoCatsUA",
  },
  {
    icon: "✖️",
    title: "X",
    description: t.platforms.items.x.description,
    url: "https://x.com/SkubaVital777",
  },
  {
    icon: "📷",
    title: "Instagram",
    description: t.platforms.items.instagram.description,
    url: "https://instagram.com/cosmocatsua",
  },
  {
    icon: "📘",
    title: "Facebook",
    description: t.platforms.items.facebook.description,
    url: "https://facebook.com/vitalij.skubcenko",
  },
];

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">

        <header className="mb-8">
          <h1 className="text-3xl font-bold">
            🌐 {t.rooms.platforms.title}
          </h1>

          <p className="mt-3 text-slate-300">
            {t.rooms.platforms.desc}
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {platforms.map((platform) => (
            <RoomCard
              key={platform.title}
              icon={platform.icon}
              title={platform.title}
              description={platform.description}
              url={platform.url}
              buttonLabel={t.common.open}
            />
          ))}

        </div>

      </div>
    </main>
  );
}