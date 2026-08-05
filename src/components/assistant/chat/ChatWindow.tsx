"use client";

import ChatMessage from "./ChatMessage";

type Message = {
  role: "assistant" | "user";
  text: string;
};

type Props = {
  messages: Message[];
  isLoading: boolean;
};

export default function ChatWindow({
  messages,
  isLoading,
}: Props) {
  return (
    <div
      className="
        mt-10
        rounded-3xl
        border
        border-sky-500/20
        bg-slate-900/40

        p-4
        sm:p-6
        md:p-8

        space-y-5

        max-h-[65vh]
        overflow-y-auto

        scroll-smooth
      "
    >
      {messages.map((message, index) => (
        <ChatMessage
          key={index}
          role={message.role}
          text={message.text}
        />
      ))}
      {isLoading && (
         <ChatMessage
             role="assistant"
             text="● ● ●"
             typing
         />
      )}
    </div>
  );
}   