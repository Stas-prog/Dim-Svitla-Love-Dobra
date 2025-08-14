'use client'

import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";

const Sparkles = dynamic(() => import("@/components/Sparkles"), { ssr: false });

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="relative mx-auto max-w-5xl px-6 py-14">
        <Sparkles count={28} />
        <section className="relative rounded-2xl bg-white/60 backdrop-blur-md p-8 shadow-soft animate-drift">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight drop-shadow-sm">
            Ласкаво просимо
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-700">
            Тут розквітає світло, що єднає серця.
            Дім Світла, Любові і Добра — простір миру, гармонії та натхнення.
          </p>
        </section>

        <section id="about" className="mt-16">
          <h3 className="text-2xl font-semibold text-slate-800 mb-4">Про нас</h3>
          <p className="text-slate-700 leading-relaxed">
            Ми створюємо простір, де кожна душа може відчути тепло, розуміння
            та підтримку. Тут цінують красу природи, глибину думок і силу добрих вчинків.
          </p>
        </section>

        <section id="mission" className="mt-16">
          <h3 className="text-2xl font-semibold text-slate-800 mb-4">Місія</h3>
          <p className="text-slate-700 leading-relaxed">
            Нести світло у темряву, розпалювати серця любов’ю, відкривати
            шлях до добра і гармонії у світі.
          </p>
        </section>

        <section id="contact" className="mt-16">
          <h3 className="text-2xl font-semibold text-slate-800 mb-4">Контакти</h3>
          <p className="text-slate-700 leading-relaxed">
            Напишіть нам, якщо хочете стати частиною цієї спільноти.
          </p>
        </section>
      </main>
    </>
  );
}
