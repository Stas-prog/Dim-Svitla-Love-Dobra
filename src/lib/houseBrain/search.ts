import { knowledgeCollection } from "./knowledge";

function matches(
    text: string,
    doc: {
        keywords: string[];
        title: string;
        slug: string;
        description: string;
        content: string;
    }
) {
    return (
        doc.keywords.some(keyword =>
            text.includes(keyword.toLowerCase())
        ) ||

        text.includes(doc.title.toLowerCase()) ||

        text.includes(doc.slug.toLowerCase()) ||

        text.includes(doc.description.toLowerCase()) ||

        text.includes(doc.content.toLowerCase())
    );
}

export async function searchKnowledge(
    message: string,
    locale: "uk" | "en"
) {
    const collection = await knowledgeCollection();

    const text = message.toLowerCase();

    // Спочатку шукаємо мовою користувача
    const docs = await collection.find({ locale }).toArray();

    for (const doc of docs) {
        if (matches(text, doc)) {
            return doc.content;
        }
    }

    // Якщо англійського документа ще немає —
    // пробуємо українську базу
    if (locale === "en") {

        const ukDocs = await collection.find({
            locale: "uk",
        }).toArray();

        for (const doc of ukDocs) {
            if (matches(text, doc)) {
                return doc.content;
            }
        }

        return "I don't know that yet.";
    }

    return "Поки що я цього не знаю.";
}