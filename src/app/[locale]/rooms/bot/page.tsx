"use client";

import { useParams, useRouter } from "next/navigation";
import AssistantHero from "@/components/assistant/AssistantHero";
import AssistantGrid from "@/components/assistant/AssistantGrid";
import AssistantAction from "@/components/assistant/AssistantAction";

export default function BotRoom() {
const router = useRouter();
const { locale } = useParams<{ locale: string }>();

  return (
  <main className="relative min-h-screen bg-slate-950 p-4 sm:p-6 overflow-hidden">
  <div className="absolute inset-0 dawn-glow opacity-40" />

  <div className="relative z-10 mx-auto max-w-6xl space-y-10">

    <AssistantHero />

    <AssistantGrid />

    <AssistantAction onClick={() => router.push(`/${locale}/assistant`)}/>

  </div>
</main>
  );
}

