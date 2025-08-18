// !!! без 'use client'
import { use } from 'react';
import Vision from '@/components/Vision';

type Params = { id: string };
type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
    params: Promise<Params>;
    searchParams?: Promise<SearchParams>;
};

export default function VisionRoomPage({ params, searchParams }: Props) {
    const p = use(params);

    // Розпаковуємо searchParams з коректною типізацією
    const sp: SearchParams = use(
        searchParams ?? Promise.resolve({} as SearchParams)
    );

    // Дістаємо mode безпечно
    const rawMode = typeof sp.mode === 'string'
        ? sp.mode
        : Array.isArray(sp.mode)
            ? sp.mode[0]
            : undefined;

    const initialMode = rawMode === 'host' ? ('host' as const) : ('viewer' as const);

    return (
        <main className="min-h-screen bg-black text-white px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-1">👁️ Зір Світлозіра — Кімната</h1>
                <p className="text-slate-300 mb-6">
                    Room: <span className="font-mono">{p.id}</span> · Режим:{' '}
                    <span className="font-semibold">{initialMode}</span>
                </p>

                {/* Клієнтський компонент */}
                <Vision roomId={p.id} initialMode={initialMode} />
            </div>
        </main>
    );
}
