"use client"

import { useMessages } from "@/messages/useMessages";

export default function AssistantHero() {
  const t = useMessages();

  return (
    <section className="text-center py-10">

      <div className="inline-flex items-center rounded-full bg-sky-500/10 px-5 py-2 text-sky-300 border border-sky-500/30">

        {t.assistant.hero.badge}

      </div>

      <h1 className="mt-6 text-5xl font-bold text-white">

        {t.assistant.hero.title}

      </h1>

      <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">

        {t.assistant.hero.subtitle}

      </p>

    </section>
  );
}