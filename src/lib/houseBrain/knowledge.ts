import { getDb } from "@/lib/mongo";
import { KnowledgeDoc } from "./types";


export async function knowledgeCollection() {
    const db = await getDb();
    return db.collection<KnowledgeDoc>("knowledge");
}

export async function getKnowledgeBySlug(
    slug: string,
    locale: "uk" | "en"
) {
    const col = await knowledgeCollection();

    return col.findOne({
        slug,
        locale,
    });
}

export async function getKnowledgeByCategory(
    category: KnowledgeDoc["category"],
    locale: "uk" | "en"
) {
    const col = await knowledgeCollection();

    return col.find({
        category,
        locale,
    }).toArray();
}