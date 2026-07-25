"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useMessages } from "@/messages/useMessages";

export default function RoomsPage() {
  const pathname = usePathname();

  const locale = pathname.split("/")[1] || "uk";

  const t = useMessages();

  const route = (path: string) => `/${locale}${path}`;

  const rooms = [
    { id: "platforms", ...t.rooms.platforms },
    { id: "happiness", ...t.rooms.happiness },
    { id: "through_earth", ...t.rooms.through_earth },
    { id: "bot", ...t.rooms.bot },
    { id: "compass", ...t.rooms.compass },
    { id: "meditation", ...t.rooms.meditation },
    { id: "prayer", ...t.rooms.prayer },
    { id: "library", ...t.rooms.library },
    { id: "cinema", ...t.rooms.cinema },
    { id: "music", ...t.rooms.music },
    { id: "sport", ...t.rooms.sport },
    { id: "news", ...t.rooms.news },
  ];

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 p-6">
      <h1 className="mb-8 text-center text-3xl font-bold">
        {t.rooms.title}
      </h1>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <Link
            key={room.id}
            href={route(`/rooms/${room.id}`)}
            className="
              rounded-2xl
              border
              border-slate-700
              bg-slate-800
              p-5
              transition-all
              duration-300
              hover:scale-[1.02]
              hover:border-sky-400
              hover:bg-slate-700
              hover:shadow-2xl
            "
          >
            <h2 className="text-lg font-semibold">
              {room.title}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {room.desc}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}