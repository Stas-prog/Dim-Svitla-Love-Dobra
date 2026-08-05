"use client";

import { useState } from "react";

import { useMessages } from "@/messages/useMessages";

type Props = {
  onSend: (text: string) => void;
};

export default function ChatInput({
  onSend,
}: Props) {
  const t = useMessages();

  const [text, setText] = useState("");

  function send() {
    if (!text.trim()) return;

    onSend(text);
    setText("");
  }

  return (
    <div
      className="
        mt-4
        flex
        flex-col
        gap-3
        md:flex-row
        md:items-end
        md:gap-4
      "
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            send();
          }
        }}
        placeholder={t.assistantChat.placeholder}
        className="
          w-full
          flex-1
          rounded-2xl
          border
          border-sky-500/20
          bg-slate-800
          px-5
          py-4
          text-white
          outline-none
          transition
          focus:border-sky-400
          focus:ring-2
          focus:ring-sky-500/20
        "
      />

      <button
        onClick={send}
        className="
          w-full
          rounded-2xl
          bg-sky-600
          px-6
          py-4
          font-bold
          text-white
          transition
          hover:bg-sky-500
          active:scale-95
          md:w-auto
          md:min-w-[170px]
        "
      >
        {t.assistantChat.send}
      </button>
    </div>
  );
}