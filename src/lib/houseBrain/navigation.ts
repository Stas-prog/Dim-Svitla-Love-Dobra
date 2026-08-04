import { knowledgeCollection } from "./knowledge";

export async function getRoomBySlug(slug: string) {
  const col = await knowledgeCollection();

  return col.findOne({
    slug,
    category: "room",
  });
}

export async function getProjectBySlug(slug: string) {
  const col = await knowledgeCollection();

  return col.findOne({
    slug,
    category: "project",
  });
}