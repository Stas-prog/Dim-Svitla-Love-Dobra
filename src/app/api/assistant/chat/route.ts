import { NextResponse } from "next/server";

import { openai } from "@/lib/openai";
import { buildSystemPrompt } from "@/lib/houseBrain/middleware";

type ChatMessage = {
    role: "user" | "assistant";
    text: string;
};

export async function POST(req: Request) {

    let locale: "uk" | "en" = "uk";

    try {

        const body = await req.json();

        locale =
            body.locale === "en"
                ? "en"
                : "uk";

        const history: ChatMessage[] =
            Array.isArray(body.history)
                ? body.history
                : [];

        const recentHistory =
            history.slice(-12);

        const systemPrompt =
            buildSystemPrompt();

        const conversation = recentHistory.map(message => ({

            role: message.role,

            content: message.text,

        }));

        const completion =
            await openai.chat.completions.create({

                model: "gpt-5",

                messages: [

                    {
                        role: "system",
                        content: systemPrompt,
                    },

                    ...conversation,

                ],

            });

        const answer =
            completion.choices[0].message.content?.trim()
            ||
            (
                locale === "en"
                    ? "I don't know yet."
                    : "Я поки що цього не знаю."
            );

        return NextResponse.json({
            answer,
        });

    } catch (error) {

        console.error(error);

        return NextResponse.json({

            answer:

                locale === "en"

                    ? "House Assistant is temporarily unavailable."

                    : "Помічник Дому Світла тимчасово недоступний.",

        }, {

            status: 500,

        });

    }

}