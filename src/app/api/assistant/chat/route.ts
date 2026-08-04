import { NextResponse } from "next/server";

import {openai} from "@/lib/openai";
import { SYSTEM_PROMPT } from "@/lib/houseBrain/systemPrompt";
import { searchKnowledge } from "@/lib/houseBrain/search";

export async function POST(req: Request) {
    let locale: "uk" | "en" = "uk";

    try {

        const body = await req.json();

        locale = body.locale === "en"
            ? "en"
            : "uk";

        const history = Array.isArray(body.history)
            ? body.history
            : [];

        // Беремо тільки останні повідомлення
        const recentHistory = history.slice(-12);

        const lastUserMessage =
            [...recentHistory]
                .reverse()
                .find((m) => m.role === "user")?.text ?? "";

        const knowledge = await searchKnowledge(lastUserMessage, locale);

        const conversation = recentHistory.map(
            (item: {
                role: "user" | "assistant";
                text: string;
            }) => ({
                role: item.role,
                content: item.text,
            })
        );

        const completion =
            await openai.chat.completions.create({

                model: "gpt-5",

                messages: [

                    {
                        role: "system",
                        content: SYSTEM_PROMPT,
                    },

                    {
                        role: "system",
                        content:
                            `Knowledge:\n${knowledge}`,
                    },

                    ...conversation,

                ],

            });

        const answer =
            completion.choices[0].message.content ??
            (
                locale === "en"
                    ? "I don't know."
                    : "Я не знаю."
            );

        return NextResponse.json({
            answer,
        });

    } catch (err) {

        console.error(err);

        return NextResponse.json(
            {
                answer:
                    locale === "en"
                        ? "House Assistant is temporarily unavailable."
                        : "Помічник Дому Світла тимчасово недоступний.",
            },
            {
                status: 500,
            }
        );
    }
}