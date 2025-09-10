// src/app/rooms/[id]/page.tsx
"use client";
import { useParams } from "next/navigation";

const content: Record<string, {title:string, body:string}> = {
  happiness: { title: "Генератор Щастя", body: "Тут скоро з’явиться промінь радості 💛" },
  bot: { title: "Бот-помічник", body: "Тут житиме твій космічний друг 🤖" },
  compass: { title: "Космічний Компас", body: "Тут відкриється зоряна навігація 🌌" },
  meditation: { title: "Зал для медитацій", body: "Тут будуть ролики Нідра-йоги 🧘" },
  prayer: { title: "Кімната молитви", body: "Тут буде простір для тиші і молитви 🙏" },
  library: { title: "Бібліотека", body: "Тут буде колекція книг 📚" },
  cinema: { title: "Фільмотека", body: "Тут буде кінотеатр 🎬" },
  music: { title: "Музика", body: "Тут зазвучить мелодія 🎶" },
  sport: { title: "Спорт", body: "Тут буде зал для вправ 🏋️" },
  news: { title: "Новини науки", body: "Тут відкриється портал до майбутнього 🌍" },
};

export default function RoomPage() {
  const { id } = useParams();
  const room = content[id as string] ?? { title: "Невідома кімната", body: "Ця кімната ще будується 🚧" };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 p-8">
      <h1 className="text-3xl font-bold mb-4">{room.title}</h1>
      <p className="text-slate-300">{room.body}</p>
    </main>
  );
}
