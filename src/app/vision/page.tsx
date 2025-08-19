export const dynamic = "force-dynamic";

import Vision from "@/components/Vision";

export default function VisionPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 text-white">
            <h1 className="text-2xl font-bold">👁️ Vision (простий режим)</h1>
            <p className="text-slate-300 mb-4">Вибери host або viewer, натисни «Підключити». Кнопка «Зробити фото в Mongo» зберігає кадр.</p>
            <Vision initialMode="host" />
        </main>
    );
}
