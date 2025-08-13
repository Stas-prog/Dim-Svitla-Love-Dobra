'use client'

import dynamic from 'next/dynamic'

// якщо твій Bot.tsx лежить у components/Bot.tsx:
const Bot = dynamic(() => import('@/components/Bot'), { ssr: false })

export default function TraderPage() {
    return (
        <div className="py-12">
            <h1 className="text-3xl font-bold">OKX — Міні-бот (демо)</h1>
            <p className="mt-2 text-zinc-300">
                Тут з’являються живі котирування, SMA-сигнали й симуляція заявок.
            </p>
            <div className="mt-6">
                <Bot />
            </div>
        </div>
    )
}
