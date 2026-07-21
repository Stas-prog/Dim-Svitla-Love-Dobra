"use client";

import { ExternalLink } from "lucide-react";

const platforms = [
  {
    icon: "▶️",
    title: "YouTube",
    description: "Відео, лекції та натхнення.",
    url: "https://youtube.com/@cosmocatsua?si=HG7aS4yu6d0dk1Fg",
  },
  {
    icon: "🎵",
    title: "TikTok",
    description: "Короткі відео та цікаві ідеї.",
    url: "https://tiktok.com/@cosmocats_",
  },
  {
    icon: "💬",
    title: "Telegram",
    description: "Новини та спілкування.",
    url: "https://t.me/CosmoCatsUA",
  },
//   {
//     icon: "💻",
//     title: "GitHub",
//     description: "Відкриті проєкти Дому.",
//     url: "https://github.com/Stas-prog",
//   },
  {
    icon: "✖️",
    title: "X",
    description: "Останні повідомлення.",
    url: "https://x.com/SkubaVital777",
  },
  {
    icon: "📷",
    title: "Instagram",
    description: "Фото та історії.",
    url: "https://instagram.com/cosmocatsua",
  },
  {
    icon: "📘",
    title: "Facebook",
    description: "Спільнота Дому Світла.",
    url: "https://facebook.com/vitalij.skubcenko",
  },
];

export default function PlatformsRoom() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">

        <header className="mb-6">
          <h1 className="text-2xl font-bold">
            🌐 Зала платформ
          </h1>

          <p className="mt-2 text-slate-300">
            Тут знаходяться офіційні сторінки Дому Світла.
            Обирай будь-яку платформу та продовжуй подорож.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {platforms.map((item) => (

            <div
              key={item.title}
              className="rounded-xl border border-slate-700 bg-slate-800 p-5"
            >

              <h2 className="text-xl font-semibold">
                {item.icon} {item.title}
              </h2>

              <p className="mt-2 text-slate-300">
                {item.description}
              </p>

              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 font-semibold hover:bg-sky-500"
              >
                Відкрити
                <ExternalLink size={16} />
              </a>

            </div>

          ))}

        </div>

      </div>
    </main>
  );
}