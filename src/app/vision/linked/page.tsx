"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Vision from "@/components/Vision";

export default function VisionLinkedPage() {
    const [viewerUrl, setViewerUrl] = useState<string>("");

    useEffect(() => {
        // робимо це тільки на клієнті, щоб уникнути hydration mismatch
        setViewerUrl(`${location.origin}/vision`);
    }, []);

    async function copy() {
        try {
            await navigator.clipboard.writeText(viewerUrl);
            alert("Посилання скопійовано у буфер!");
        } catch { }
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-200 p-4 sm:p-6">
            <div className="mx-auto max-w-5xl">
                {/* Навбар сторінки Vision (Linked) */}
                <div className="mb-3 flex flex-wrap items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">🔗 Vision (з посиланням)</h1>
                    <Link
                        href="/vision"
                        className="ml-auto rounded-lg bg-slate-700 px-3 py-1.5 text-white text-sm hover:bg-slate-800"
                    >
                        ◀ Повернутися до Vision
                    </Link>
                </div>

                {/* Блок з лінком для переглядача */}
                <div className="mb-4 rounded-xl bg-white/80 p-3 shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-600 mb-2">
                        Надішли це посилання переглядачу (він відкриє /vision і натисне <b>Join (Viewer)</b>):
                    </div>
                    <div className="flex gap-2">
                        <input
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 text-sm"
                            value={viewerUrl}
                            readOnly
                        />
                        <button onClick={copy} className="rounded-lg bg-indigo-600 px-3 py-2 text-white text-sm hover:bg-indigo-700">
                            Копіювати
                        </button>
                    </div>
                </div>

                <Vision />
            </div>
        </main>
    );
}
