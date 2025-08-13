import GlowCard from '@/components/GlowCard'
import Link from 'next/link'

export default function ProjectsPage() {
    return (
        <div className="py-12">
            <h1 className="text-3xl font-bold">Наші проєкти</h1>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <GlowCard title="Компас Всесвіту" emoji="🧭">
                    3D/AR-орієнтація по Сонцю/Везі, оновлення координат,
                    “приклеєний” приціл — готуємо гіроскоп і точні розрахунки.
                </GlowCard>
                <GlowCard title="OKX Трекер" emoji="💹">
                    Live-котирування, SMA-сигнали, історія ордерів.
                    <div className="mt-3">
                        <Link href="/trader" className="btn-ghost">Відкрити</Link>
                    </div>
                </GlowCard>
                <GlowCard title="Світлий Простір" emoji="🌱">
                    Кімната тепла: тексти, музику, практики турботи об’єднаємо
                    в один живий простір. Скоро анонс!
                </GlowCard>
            </div>
        </div>
    )
}
