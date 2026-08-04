"use client";

import ChatMessage from "./ChatMessage";

type Message = {
  role: "assistant" | "user";
  text: string;
};

type Props = {
  messages: Message[];
};

export default function ChatWindow({
  messages,
}: Props) {
  return (
    <div
      className="
        mt-10
        rounded-3xl
        border
        border-sky-500/20
        bg-slate-900/40
        p-6
        space-y-4
      "
    >
      {messages.map((message, index) => (
        <ChatMessage
          key={index}
          role={message.role}
          text={message.text}
        />
      ))}
    </div>
  );
}