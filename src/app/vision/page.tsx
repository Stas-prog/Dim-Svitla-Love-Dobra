'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export default function VisionIndexPage() {
    // Щоб уникнути hydration mismatch: усе, що залежить від window/crypto — у useEffect
    const [ready, setReady] = useState(false);
    const [roomId, setRoomId] = useState<string>('');

    useEffect(() => {
        setReady(true);
        const id =
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
                ? crypto.randomUUID()
                : `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
        setRoomId(id);
    }, []);

    const fallback = useMemo(() => 'creating…', []);

    return (
        <main className="min-h-screen bg-black text-white px-6 py-10">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">👁️ Зір Світлозіра — Вхід</h1>
                <p className="text-slate-300 mb-6">
                    Обери режим: <span className="font-semibold">Host</span> (передавач відео) або <span className="font-semibold">Viewer</span> (глядач).
                    Для спільного сеансу використай персональне посилання на кімнату.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Link
                        href={ready ? `/vision/${roomId}?mode=host` : '#'}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition px-4 py-3 text-center font-semibold disabled:opacity-60"
                        aria-disabled={!ready}
                    >
                        🚀 Створити кімнату як Host
                        <div className="text-xs opacity-80">
                            {ready ? `/vision/${roomId}?mode=host` : fallback}
                        </div>
                    </Link>

                    <Link
                        href={ready ? `/vision/${roomId}?mode=viewer` : '#'}
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition px-4 py-3 text-center font-semibold disabled:opacity-60"
                        aria-disabled={!ready}
                    >
                        👀 Увійти як Viewer
                        <div className="text-xs opacity-80">
                            {ready ? `/vision/${roomId}?mode=viewer` : fallback}
                        </div>
                    </Link>
                </div>

                <div className="mt-8 rounded-xl bg-white/5 border border-white/10 p-4">
                    <h2 className="font-semibold mb-2">Підказка</h2>
                    <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
                        <li>Host увімкне камеру та мікрофон (за бажанням) і надасть відео.</li>
                        <li>Viewer побачить відео, а також (у кімнаті) зможе робити знімки в Mongo.</li>
                        <li>Посилання виду <code className="bg-white/10 px-1 rounded">/vision/&lt;id&gt;</code> — ваша персональна кімната.</li>
                    </ul>
                </div>
            </div>
        </main>
    );
}
