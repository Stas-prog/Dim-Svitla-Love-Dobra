export type Locale = "uk" | "en";

export type KnowledgeCategory =
  | "room"
  | "project"
  | "mission"
  | "manifest"
  | "faq"
  | "person";

export interface KnowledgeDoc {
  slug: string;

  locale: Locale;

  category: KnowledgeCategory;

  title: string;

  description: string;

  content: string;

  keywords: string[];

  route?: string;

  createdAt: string;

  updatedAt: string;
}