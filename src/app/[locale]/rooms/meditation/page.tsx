"use client";

import MeditationSection from "@/components/rooms/MeditationSection";
import { meditationSections } from "@/data/Meditation";
import { useMessages } from "@/messages/useMessages";

export default function MeditationRoom() {
  const t = useMessages();

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">
            🧘 {t.rooms.meditation.title}
          </h1>

          <p className="mt-3 max-w-3xl text-slate-300">
            {t.meditation.intro}
          </p>
        </header>

        <MeditationSection
          title={t.meditation.nidra.title}
          description={t.meditation.nidra.description}
          note={t.meditation.nidra.note}
          links={meditationSections.nidra}
        />

        <MeditationSection
          title={t.meditation.livanda.title}
          description={t.meditation.livanda.description}
          links={meditationSections.livanda}
        />

        <MeditationSection
          title={t.meditation.illaya.title}
          description={t.meditation.illaya.description}
          links={meditationSections.illaya}
        />

        <MeditationSection
          title={t.meditation.reiki.title}
          description={t.meditation.reiki.description}
          links={meditationSections.reiki}
        />
      </div>
    </main>
  );
}