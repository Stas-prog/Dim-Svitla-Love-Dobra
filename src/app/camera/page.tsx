"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export default function CameraLanding() {
    const [roomId, setRoomId] = useState("");

    const newId = useMemo(
        () => Math.random().toString(36).slice(2, 8).toUpperCase(),
        []
    );

    return (
        <main className="min-h-screen bg-black text-white p-6">
            <h1 className="text-2xl font-bold mb-4">🎥 Камера (WebRTC)</h1>

            <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4 max-w-xl">
                <p className="text-sm text-gray-300 mb-3">
                    Обери режим:
                </p>

                <div className="flex flex-col gap-3">
                    <Link
                        href={`/camera/host?room=${newId}`}
                        className="rounded bg-emerald-600 hover:bg-emerald-500 px-4 py-2 inline-block text-sm text-center"
                    >
                        Я транслюю (створити кімнату {newId})
                    </Link>

                    <div className="flex items-center gap-2">
                        <input
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            placeholder="Введи код кімнати (напр. ABC123)"
                            className="flex-1 rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm placeholder-gray-500"
                        />
                        <Link
                            href={`/camera/view?room=${encodeURIComponent(roomId.trim())}`}
                            className="rounded bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm"
                        >
                            Дивитись
                        </Link>
                    </div>

                    <p className="text-xs text-gray-400">
                        Потрібен HTTPS і дозвіл на камеру/мікрофон. На iPhone натисни “Start camera”.
                    </p>
                </div>
            </div>
        </main>
    );
}
