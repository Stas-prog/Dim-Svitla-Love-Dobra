import { KnowledgeDoc } from "./types";

export function rankKnowledge(
    docs: KnowledgeDoc[],
    message: string
): KnowledgeDoc | null {

    const text = message.toLowerCase();

    let best: KnowledgeDoc | null = null;
    let score = 0;

    for (const doc of docs) {

        let current = 0;

        if (text.includes(doc.slug.toLowerCase()))
            current += 100;

        if (text.includes(doc.title.toLowerCase()))
            current += 50;

        for (const keyword of doc.keywords) {

            if (text.includes(keyword.toLowerCase()))
                current += 10;

        }

        if (current > score) {
            score = current;
            best = doc;
        }
    }

    return best;
}