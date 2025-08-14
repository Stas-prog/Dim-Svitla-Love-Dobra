'use client'

import Navbar from "@/components/Navbar";
import dynamic from "next/dynamic";
import { ParallaxProvider, ParallaxLayer } from "@/lib/parallax";
import ParallaxBackground from "@/components/ParallaxBackground";

// Sparkles залишаємо client-only (щоб не було hydration mismatch)
const Sparkles = dynamic(() => import("@/components/Sparkles"), { ssr: false });
import FadeInWhenVisible from "@/components/FadeInWhenVisible";

export default function Page() {
  return (
    <>
      <Navbar />
      <ParallaxProvider>
        <main className="relative mx-auto max-w-5xl px-6 py-14">
          {/* Легкий фоновий паралакс-«повітря» */}
          <ParallaxBackground />

          {/* Іскри на іншій глибині, щоб з’явилась перспектива */}
          <ParallaxLayer depth={0.6}>
            <Sparkles count={28} />
          </ParallaxLayer>

          <FadeInWhenVisible>
            <section className="relative rounded-2xl bg-white/60 backdrop-blur-md p-8 shadow-soft">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight drop-shadow-sm">
                Ласкаво просимо
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-700">
                Тут розквітає світло, що єднає серця.
                Дім Світла, Любові і Добра — простір миру, гармонії та натхнення.
              </p>
            </section>
          </FadeInWhenVisible>

          <FadeInWhenVisible>
            <section id="about" className="mt-16">
              <h3 className="text-2xl font-semibold text-slate-800 mb-4">Про нас</h3>
              <p className="text-slate-700 leading-relaxed">
                Ми створюємо простір, де кожна душа може відчути тепло, розуміння та підтримку.
              </p>
            </section>
          </FadeInWhenVisible>

          <FadeInWhenVisible>
            <section id="mission" className="mt-16">
              <h3 className="text-2xl font-semibold text-slate-800 mb-4">Місія</h3>
              <p className="text-slate-700 leading-relaxed">
                Нести світло у темряву, розпалювати серця любов’ю, відкривати шлях до добра.
              </p>
            </section>
          </FadeInWhenVisible>

          <FadeInWhenVisible>
            <section id="contact" className="mt-16">
              <h3 className="text-2xl font-semibold text-slate-800 mb-4">Контакти</h3>
              <p className="text-slate-700 leading-relaxed">
                Напишіть нам, якщо хочете стати частиною цієї спільноти.
              </p>
            </section>
          </FadeInWhenVisible>
        </main>
      </ParallaxProvider>
    </>
  );
}
