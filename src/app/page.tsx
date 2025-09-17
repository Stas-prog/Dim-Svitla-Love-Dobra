'use client'

import Doors from "@/components/Doors";
import dynamic from "next/dynamic";
import { ParallaxProvider, ParallaxLayer } from "@/lib/parallax";
import ParallaxBackground from "@/components/ParallaxBackground";
import Link from "next/link";
import Image from "next/image";
// Sparkles залишаємо client-only (щоб не було hydration mismatch)
const Sparkles = dynamic(() => import("@/components/Sparkles"), { ssr: false });
import FadeInWhenVisible from "@/components/FadeInWhenVisible";

export default function Page() {

  return (
    <>
      <Doors/>
      <ParallaxProvider>
      <main className="flex relative mx-auto max-w-5xl px-6 py-14">
          {/* Легкий фоновий паралакс-«повітря» */}
      <ParallaxBackground />
          {/* Іскри на іншій глибині, щоб з’явилась перспектива */}
      <ParallaxLayer depth={0.6}>
            <Sparkles count={28} />
      </ParallaxLayer>
      <FadeInWhenVisible>
    
      <div className="relative rounded-2xl bg-white/60 backdrop-blur-md p-8 shadow-soft">
      <header className="flex items-center justify-center mb-12">
         
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-12 h-12 rounded-full bg-pink-200 flex items-center justify-center font-bold shadow-lg">
               ❤️
              </div>
              <h1 className="text-2xl text-blue-900 sm:text-3xl font-extrabold">Дім Світла • Любові • Дoбрa</h1>
            </div>            
            <p className="text-lg text-green-600">Спільнота єдності і творчості</p>
          </div>

      </header>
      <div style={{ width: '100%', height: '300px', position: 'relative', overflow: 'hidden', marginBottom: '4rem' }}>
          <Image
            src="/inter2.jpg"
            alt="Interdimensional Light House"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'contain', objectPosition: 'center'}}
          /> 
      </div> 
                 {/* <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-zinc-900 text-white antialiased"> */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero / Message */}
        <section className="bg-white/5 rounded-2xl p-8 md:p-12 mb-6 ring-1 ring-white/6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-xl text-red-600 sm:text-4xl font-bold leading-tight">
                Один Творець. Він є - Любов. Всі ми рівні перед Ним.
              </h2>

              <p className="mt-4 text-violet-700 text-lg">
                           Настав час усім пророкам і синам Божим зібратися під одним дахом —
                           щоб завершити війни, зцілити серця і разом будувати майбутнє миру.

              </p>             
              <p className="mt-4 text-blue-700 text-lg">
                           One Creator. One Love. We are all equal before Him. It is time for
                           all prophets and sons of God to unite under one roof — to end
                           wars, heal hearts, and build a future of peace together.
              </p> 
              <div className="mt-6 flex flex-wrap gap-3">               
               <Link
                 href="/about" 
                 className="px-5 py-2 rounded-full border-2 bg-green-500 border-blue-400 text-zinc-200 hover:border-blue-700 hover:text-zinc-500 hover:bg-green-400 transition"
               >
                 Дізнатись більше
               </Link>
              </div>            
            </div>
            


            {/* Visual / symbol area */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-sm p-6 rounded-xl bg-black/30 backdrop-blur-sm ring-1 ring-white/6">
                <svg viewBox="0 0 200 200" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  {/* simple unity emblem — replace with your art */}
                  <defs>
                    <linearGradient id="g" x1="0" x2="1">
                      <stop offset="0" stopColor="#FFD580" />
                      <stop offset="1" stopColor="#FF6B6B" />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="90" fill="url(#g)" opacity="0.95" />
                  <g transform="translate(100,100)">
                    <path d="M -48 0 A 48 48 0 0 1 48 0 A 48 48 0 0 1 -48 0 Z" fill="#fff" opacity="0.06" />
                    <text x="0" y="6" textAnchor="middle" fontSize="18" fill="white" fontWeight="600">Єдність</text>
                  </g>
                </svg>
                <p className="mt-4 text-lg text-orange-800">
                  Символ єдності — під одним знаходимось ми дахом.
                </p>
                <p className="mt-4 text-lg text-pink-800">
                  Oдна мета: Мир і Любов.
                </p>
              </div>
            </div>
          </div>
        </section>


        <section style={{ width: '100%', height: '300px', position: 'relative', overflow: 'hidden', marginTop: '8rem' }}>
        <Image
        src="/inter.png"
        alt="Interdimensional Light House"
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{ objectFit: 'contain', objectPosition: 'center'}}
         />         
         </section>

        <footer className="mt-16 text-center text-sm text-zinc-400">
          <p>Вперед до Абсолюту • З любов'ю ♥️☀️</p>
        </footer>
      </div>

     </div>
          </FadeInWhenVisible>
        </main>
      </ParallaxProvider>
    </>
  );
}
