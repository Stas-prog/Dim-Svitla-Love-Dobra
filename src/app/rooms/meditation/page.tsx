"use client";

import { Link } from "lucide-react";

export default function MeditationRoom() {
  

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex items-center gap-3">
          <h1 className="text-2xl font-bold">🧘 Зал для медитацій</h1>
          
        </header>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-slate-300">
            <h2 className="text-xl font-semibold">
                Нідра-Йога
            </h2>
            <p>Поглиблена релаксація тіла і свідомості. Рекомендовано в навушниках, лежачи.</p>
            <a href="https://www.youtube.com/watch?v=fzmzkATY_fM&t=57s" target="_blank" className="mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500">
            Я є Любов <Link size={16} />
            </a>
         
            <a href="https://www.youtube.com/watch?v=RemGwOmlvms" target="_blank" className="ml-2 mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500">
            Сеанс глибокого розслаблення <Link size={16} />
            </a>

            <a href="https://www.youtube.com/@tysha.meditate.ukraine" target="_blank" className="ml-2 mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500">
            Тиша- медитації українською<Link size={16} />
            </a>
            </div>
        <div className="mt-3 rounded-xl border border-slate-700 bg-slate-800 p-4 text-slate-300">
            <h2 className="text-xl font-semibold">
                Ліванда
            </h2>
            <p>Медитації для зцілення. Рекомендовано в навушниках, лежачи.</p>
            <a href="https://www.youtube.com/watch?v=PTk1FmFeZhg" target="_blank" className="mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500">
            Мир, єдність і любов <Link size={16} />
            </a>
         
            <a href="https://www.youtube.com/watch?v=BkWU1tX5sVg&t=18s" target="_blank" className="ml-2 mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500">
            Оновлення енергетичного балансу <Link size={16} />
            </a>

            <a href="https://www.youtube.com/@livanda_meditation" target="_blank" className="ml-2 mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500">
            Медитації від Ліванди<Link size={16} />
            </a>
            </div>

        <div className="mt-3 rounded-xl border border-slate-700 bg-slate-800 p-4 text-slate-300">
            <h2 className="text-xl font-semibold">
                Слово Іллая
            </h2>
            <p>Медитації для зцілення. Рекомендовано в навушниках, лежачи.</p>
            <a href="https://www.youtube.com/watch?v=ePuYXyqPos8" target="_blank" className="mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500">
            Світ є - любов <Link size={16} />
            </a>
         
            <a href="https://www.youtube.com/watch?v=pL3cWJi3P4Q&t=1694s" target="_blank" className="ml-2 mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500">
            Вибирай серцем <Link size={16} />
            </a>

            <a href="https://www.youtube.com/@slovoillaya" target="_blank" className="ml-2 mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500">
            Медитації від Іллая<Link size={16} />
            </a>
            </div>

        <div className="mt-3 rounded-xl border border-slate-700 bg-slate-800 p-4 text-slate-300">
            <h2 className="text-xl font-semibold">
                Кундаліні Рейкі
            </h2>
            <a href="https://reikionline.academy/uk" target="_blank" className="mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500">
            Школа Рейкі <Link size={16} />
            </a>
         
            </div>

       
      </div>
    </main>
  );
}
