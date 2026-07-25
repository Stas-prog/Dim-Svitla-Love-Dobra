import Link from "next/link";

const visionUrl =
  process.env.NEXT_PUBLIC_VISION_URL || "/vision";

export default function VisionRoomPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-16">

        <h1 className="text-4xl font-bold mb-6">
          👁 Кімната Vision
        </h1>

        <p className="max-w-3xl text-lg leading-8 text-slate-300">
          Vision — творчий простір Дому Світла.
          Тут можна досліджувати інтерактивні візуалізації,
          переглядати галереї та демонстраційні матеріали.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">

          <Link
            href={visionUrl}
            className="rounded-2xl bg-sky-600 p-6 text-center transition hover:bg-sky-500"
          >
            <div className="text-4xl mb-3">👁</div>
            <div className="text-xl font-semibold">
              Vision
            </div>
            <p className="mt-2 text-sm text-sky-100">
              Відкрити простір Vision
            </p>
          </Link>

          <Link
            href="/snaps"
            className="rounded-2xl bg-emerald-600 p-6 text-center transition hover:bg-emerald-500"
          >
            <div className="text-4xl mb-3">🖼</div>
            <div className="text-xl font-semibold">
              Галерея
            </div>
            <p className="mt-2 text-sm text-emerald-100">
              Перегляд зображень
            </p>
          </Link>

          <Link
            href="/vision/decryptor"
            className="rounded-2xl bg-violet-600 p-6 text-center transition hover:bg-violet-500"
          >
            <div className="text-4xl mb-3">🎬</div>
            <div className="text-xl font-semibold">
              Кінотеатр
            </div>
            <p className="mt-2 text-sm text-violet-100">
              Перегляд слайдів
            </p>
          </Link>

        </div>

      </div>
    </main>
  );
}