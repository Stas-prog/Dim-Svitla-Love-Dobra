"use client";

import { useMessages } from "@/messages/useMessages";

type Props = {
  onClick?: () => void;
};

export default function AssistantAction({
  onClick,
}: Props) {
  const t = useMessages();

  return (
    <section className="py-8">

      <div
        className="
          rounded-3xl
          border
          border-sky-500/20
          bg-slate-800/70
          backdrop-blur-md
          p-8
          text-center
          shadow-2xl
        "
      >
        <h2
          className="
            text-3xl
            font-bold
            text-sky-300
          "
        >
          {t.assistant.action.title}
        </h2>

        <p
          className="
            mt-5
            mx-auto
            max-w-3xl
            text-lg
            leading-8
            text-slate-300
          "
        >
          {t.assistant.action.description}
        </p>

        <button
          onClick={onClick}
          className="
            mt-8
            rounded-2xl
            bg-gradient-to-r
            from-sky-600
            via-cyan-500
            to-emerald-500
            px-8
            py-4
            text-lg
            font-bold
            text-white
            shadow-xl
            transition-all
            duration-300
            hover:scale-105
            hover:shadow-cyan-500/30
          "
        >
          {t.assistant.action.button}
        </button>
      </div>

    </section>
  );
}