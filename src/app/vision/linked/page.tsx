export const dynamic = "force-dynamic";

export default function LinkedVisionPage() {
    return (
        <main className="min-h-screen bg-slate-900 text-white">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold">🔗 Vision з посиланням</h1>
                <p className="text-slate-300 mt-2">
                    Відкрий головну Vision-сторінку, згенеруй <code className="font-mono">roomId</code> і передай глядачу
                    відносний лінк:
                </p>
                <div className="mt-3 rounded-lg bg-slate-800/70 border border-slate-700 p-3 text-sm">
                    <div className="text-slate-400">Шаблон:</div>
                    <div className="font-mono break-all">/vision/&lt;roomId&gt;?mode=viewer</div>
                </div>
                <p className="text-slate-400 mt-4">
                    Відносні шляхи безпечні для SSR та не ламають білд на Vercel.
                </p>
            </div>
        </main>
    );
}
