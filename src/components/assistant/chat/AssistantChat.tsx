"use client";

import { useState } from "react";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";

type Message = {
    role: "assistant" | "user";
    text: string;
};

type Props = {
    t: any;
    locale: "uk" | "en";
};

export default function AssistantChat({
    locale,
    t
}: Props) {

    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            text: t.assistantChat.welcome,
        },
    ]);

   async function sendMessage(text: string) {
    if (!text.trim()) return;

   const history: Message[] = [
    ...messages,
    {
        role: "user",
        text,
    },
];

    setMessages(history);

    const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            locale,
            history,
        }),
    });

    const data = await response.json();

    setMessages([
        ...history,
        {
            role: "assistant",
            text: data.answer,
        },
    ]);
}

    return (

        <>

            <ChatWindow messages={messages} />

            <ChatInput onSend={sendMessage} />

        </>

    );

}