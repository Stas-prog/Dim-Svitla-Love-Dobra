"use client";

import { useRouter, useParams } from "next/navigation";
import AssistantCard from "@/components/assistant/AssistantCard";
import { useMessages } from "@/messages/useMessages";

export default function AssistantGrid() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const t = useMessages();

  return (
    <section className="grid gap-6 md:grid-cols-2">

      <AssistantCard
        icon="🏛"
        title={t.assistant.cards.rooms.title}
        description={t.assistant.cards.rooms.description}
        onClick={() => router.push(`/${locale}/rooms`)}
      />

      <AssistantCard
        icon="🎓"
        title={t.assistant.cards.academy.title}
        description={t.assistant.cards.academy.description}
        onClick={() => router.push(`/${locale}/rooms/vision`)}
      />

      <AssistantCard
        icon="🧘"
        title={t.assistant.cards.meditation.title}
        description={t.assistant.cards.meditation.description}
        onClick={() => router.push(`/${locale}/rooms/meditation`)}
      />

      <AssistantCard
        icon="💡"
        title={t.assistant.cards.workshop.title}
        description={t.assistant.cards.workshop.description}
        onClick={() => router.push(`/${locale}/rooms/vision`)}
      />

    </section>
  );
}