"use client";

import Vision from "@/components/Vision";

export default function VisionPage() {
    return (
        <main className="min-h-screen p-6 bg-gradient-to-b from-slate-900 to-black text-white">
            <h1 className="text-2xl font-bold mb-4">👁 Зір Світлозора</h1>
            <p className="text-sm text-slate-300 mb-4">
                Відкрий цю сторінку на пристрої з камерою, натисни «Start Sharing Camera».
                Для перегляду — відкрий посилання <span className="font-mono">/vision?room=…</span> на іншому пристрої.
            </p>
            <Vision />
        </main>
    );
}
