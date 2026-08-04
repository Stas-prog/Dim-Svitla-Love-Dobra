import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

import { getDb } from "@/lib/mongo";

async function main() {
  const db = await getDb();

  const col = db.collection("house_knowledge");

  await col.deleteMany({});

  await col.insertMany([{
  slug: "rooms",

  locale: "uk",

  category: "room",

  title: "Кімнати",

  description:
    "Каталог усіх кімнат Дому Світла.",

  content: `
У Домі Світла багато кімнат.

Кожна кімната має власне призначення.

Помічник допомагає знайти потрібну кімнату.
`,

  keywords: [
    "кімнати",
    "дім",
    "навігація",
    "кімната",
    "де"
  ],

  route: "/rooms",

  createdAt: new Date().toISOString(),

  updatedAt: new Date().toISOString(),
},{
  slug: "academy",

  locale: "uk",

  category: "room",

  title: "Академія",

  description:
    "Навчання програмуванню.",

  content: `
Академія навчає програмуванню.

Тут можна вивчати React.

Next.js.

TypeScript.

MongoDB.

Node.js.

та створювати власні проєкти.
`,

  keywords: [
    "академія",
    "навчання",
    "react",
    "next",
    "typescript",
    "javascript",
    "код"
  ],

  route: "/rooms/academy",

  createdAt: new Date().toISOString(),

  updatedAt: new Date().toISOString(),
},{
  slug: "meditation",

  locale: "uk",

  category: "room",

  title: "Медитації",

  description:
    "Практики для гармонії.",

  content: `
Кімната Медитацій допомагає знайти внутрішній спокій.

Тут знаходяться практики.

Дихання.

Молитви.

Медитації.

Відпочинок.
`,

  keywords: [
    "медитація",
    "спокій",
    "гармонія",
    "відпочинок"
  ],

  route: "/rooms/meditation",

  createdAt: new Date().toISOString(),

  updatedAt: new Date().toISOString(),
},{
  slug: "ideas",

  locale: "uk",

  category: "room",

  title: "Майстерня ідей",

  description:
    "Створення нових проєктів.",

  content: `
У Майстерні Ідей народжуються нові проєкти.

Помічник допомагає планувати.

Проєктувати.

Будувати архітектуру.

Створювати код.
`,

  keywords: [
    "ідея",
    "проєкт",
    "архітектура",
    "код"
  ],

  route: "/rooms/ideas",

  createdAt: new Date().toISOString(),

  updatedAt: new Date().toISOString(),
},{
  slug: "manifest",

  locale: "uk",

  category: "manifest",

  title: "Маніфест",

  description:
    "Головна ідея Дому Світла.",

  content: `
Дім Світла створений для єдності.

Для добра.

Любові.

Миру.

Навчання.

Творчості.

Допомоги людям.
`,

  keywords: [
    "маніфест",
    "любов",
    "мир",
    "добро",
    "єдність"
  ],

  route: "/manifest",

  createdAt: new Date().toISOString(),

  updatedAt: new Date().toISOString(),
},  ]);

  console.log("Knowledge seeded.");
}

main();