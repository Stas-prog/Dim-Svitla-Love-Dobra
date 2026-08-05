import { useMessages } from "@/messages/useMessages";

type Props = {
  role: "assistant" | "user";
  text: string;
  typing?: boolean;
};

export default function ChatMessage({
  role,
  text,
typing = false,}: Props) {

  const t = useMessages();

  const isAssistant = role === "assistant";

  return (

    <div
      className={`
        flex
        ${isAssistant ? "justify-start" : "justify-end"}
      `}
    >

      <div
        className={`
          max-w-[92%]
          md:max-w-[80%]

          rounded-3xl

          px-5
          py-4

          shadow-lg

          ${
            isAssistant
              ? "bg-slate-800 border border-sky-500/20"
              : "bg-sky-600"
          }
        `}
      >

        <div
          className={`
            mb-2

            flex
            items-center
            gap-2

            font-bold

            ${
              isAssistant
                ? "text-sky-300"
                : "text-white"
            }
          `}
        >

          <span>
            {isAssistant ? "🤖" : "🙂"}
          </span>

          <span>
            {
              isAssistant
                ? t.assistantChat.assistant
                : t.assistantChat.you
            }
          </span>

        </div>

        <div
          className={`
            whitespace-pre-wrap
            break-words
            leading-7

            ${
              isAssistant
                ? "text-slate-200"
                : "text-white"
            }
          `}
        >

          {typing ? (
                        <span
                            className="
                                animate-pulse
                                tracking-[6px]
                                                "
                        >
                            ● ● ● <br />
                            {t.assistantChat.thinking}
                        </span>
                    ) : (
                        text
                    )}

        </div>

      </div>

    </div>

  );

}