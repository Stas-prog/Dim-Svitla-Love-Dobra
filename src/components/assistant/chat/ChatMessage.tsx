import { useMessages } from "@/messages/useMessages";

type Props = {
  role: "assistant" | "user";
  text: string;
};

export default function ChatMessage({
  role,
  text,
}: Props) {
  const t = useMessages();
  const isAssistant = role === "assistant";

  return (
    <div
      className="
        rounded-2xl
        bg-slate-800
        p-5
      "
    >
      <div
        className="
          mb-3
          font-bold
          text-sky-300
        "
      >
        {isAssistant ? t.assistantChat.assistant : t.assistantChat.you}
      </div>

      <div
        className="
          whitespace-pre-wrap
          leading-8
          text-slate-200
        "
      >
        {text}
      </div>
    </div>
  );
}