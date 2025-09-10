// src/app/rooms/page.tsx
"use client";
import Link from "next/link";

const rooms = [
  { id: "happiness", title: "Генератор Щастя", desc: "Дарує тобі промінь радості 💛" },
  { id: "bot", title: "Бот-помічник", desc: "Місце, де живе наш розумний друг 🤖" },
  { id: "compass", title: "Космічний Компас", desc: "Відчуй рух Землі та Сонця ✨" },
  { id: "meditation", title: "Зал для медитацій", desc: "Розслаблення і гармонія 🧘" },
  { id: "prayer", title: "Кімната молитви", desc: "Тиха присутність і вдячність 🙏" },
  { id: "library", title: "Бібліотека", desc: "Знання і мудрість 📚" },
  { id: "cinema", title: "Фільмотека", desc: "Надихаюче кіно 🎬" },
  { id: "music", title: "Музика", desc: "Звуки душі 🎶" },
  { id: "sport", title: "Спорт", desc: "Рух і здоров’я 🏃" },
  { id: "news", title: "Новини науки", desc: "Глобальні відкриття 🌍" },
];

export default function RoomsPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 p-6">
      <h1 className="text-2xl font-bold mb-6">🏡 Кімнати Дому Світла</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map(r => (
          <Link
            key={r.id}
            href={`/rooms/${r.id}`}
            className="block rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 transition"
          >
            <h2 className="text-lg font-semibold">{r.title}</h2>
            <p className="text-sm text-slate-400 mt-1">{r.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
