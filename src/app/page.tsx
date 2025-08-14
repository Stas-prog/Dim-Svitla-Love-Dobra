// app/page.tsx
import Sparkles from "@/components/Sparkles";

export default function Page() {
  return (
    <main className="relative mx-auto max-w-5xl px-6 py-14">
      <Sparkles count={32} />

      <section className="relative rounded-2xl bg-white/50 backdrop-blur-md p-8 shadow-soft animate-drift">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight drop-shadow-sm">
          Дім Світла, Любові і Добра
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-700">
          Нова Ера вже сходить — як світанок над тихою рікою. Нехай цей простір
          наповнює серце теплом, ясністю і миром.
        </p>

        <div className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white/60 px-5 py-3 shadow-soft">
          <span className="h-2 w-2 animate-twinkle-slow rounded-full bg-amber-400" />
          <span className="text-sm text-slate-600">Світло активне</span>
        </div>
      </section>
    </main>
  );
}
