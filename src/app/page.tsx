import Link from 'next/link'
import GlowCard from '@/components/GlowCard'

export default function HomePage() {
  return (
    <div className="py-16 sm:py-20">
      <section className="text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Дім Світла, Любові і Добра
        </h1>
        <p className="mt-4 text-zinc-300 max-w-2xl mx-auto">
          Місце, де ми ростимо натхнення, творимо корисні інструменти й
          збираємося в подорож до Світла. Разом сильніші. 💫
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/projects" className="btn-primary">Наші проєкти</Link>
          <Link href="/trader" className="btn-ghost">Міні-бот трейдера</Link>
          <Link href="/about" className="btn-ghost">Про нас</Link>
        </div>
      </section>

      <section className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <GlowCard title="Компас Всесвіту" emoji="🧭">
          Інтерактивний космічний компас із реальними орієнтирами: Сонце, Вега
          та напрям руху системи. Попереду — гіроскоп і VR-режим.
        </GlowCard>

        <GlowCard title="OKX Трекер" emoji="💹">
          Живі котирування та міні-бот зі стратегіями (SMA тощо).
          Ми рухаємося до повної автоматизації з реальними заявками.
        </GlowCard>

        <GlowCard title="Світлий Простір" emoji="🏡">
          Цифровий відсік для творчості: тексти, візуали, музику і
          “м’які технології” турботи про себе. Разом — до високої ноти життя.
        </GlowCard>
      </section>

      <section className="mt-14 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-bold">Новини дому</h2>
        <ul className="mt-4 space-y-2 text-zinc-300">
          <li>• Стартував новий каркас сайту на Next.js + Tailwind.</li>
          <li>• Додано сторінку трейдера з живим оновленням даних.</li>
          <li>• Готуємо інтеграцію гіроскопа для компаса.</li>
        </ul>
      </section>
    </div>
  )
}
