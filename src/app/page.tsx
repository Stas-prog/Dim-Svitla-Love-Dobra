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
              <h1 className="text-4xl font-bold mb-6">✨ Дім Світла, Любові і Добра ✨</h1>
              <p className="max-w-xl mx-auto text-lg text-slate-600 mb-8">
                Ласкаво просимо у наш простір. Тут народжується нове бачення світу —
                з гармонією, єдністю та відкритим серцем. 💛
              </p>
              <a
                href="/vision"
                className="px-6 py-3 bg-sky-500 hover:bg-sky-600 rounded-lg text-white text-lg font-semibold shadow-lg transition"
              >
                🚀 Почати Vision
              </a>
            </section>
          </FadeInWhenVisible>
        </main>
      </ParallaxProvider>
    </>
  );
}
