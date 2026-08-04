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
    <div className="flex mt-4 gap-4">

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
          flex-1
          rounded-2xl
          border
          border-sky-500/20
          bg-slate-800
          px-5
          py-4
          text-white
          outline-none
        "
      />

      <button
        onClick={send}
        className="
          rounded-2xl
          bg-sky-600
          px-6
          py-4
          font-bold
          text-white
          transition
          hover:bg-sky-500
        "
      >
        {t.assistantChat.send}
      </button>

    </div>
  );
}