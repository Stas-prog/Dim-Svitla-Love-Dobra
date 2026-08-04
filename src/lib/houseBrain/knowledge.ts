import { getDb } from "@/lib/mongo";
import { KnowledgeDoc } from "./types";

const COLLECTION = "house_knowledge";

export async function knowledgeCollection() {
  const db = await getDb();
  return db.collection<KnowledgeDoc>(COLLECTION);
}