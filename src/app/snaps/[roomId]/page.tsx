export const dynamic = "force-dynamic";

type Slide = { url: string; createdAt?: string };

async function getSlides(roomId: string): Promise<Slide[]> {
  const qs = new URLSearchParams({ roomId, limit: "100" }).toString();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/slides?${qs}`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const j = await res.json();
  return Array.isArray(j?.items) ? j.items : [];
}

export default async function SnapsRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const slides = await getSlides(roomId);

  return (
    <main className="min-h-screen bg-black text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">🖼 Фото кімнати {roomId}</h1>

        {slides.length === 0 && (
          <div className="text-slate-400">У цій кімнаті поки немає фото.</div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((s, i) => (
            <figure key={i} className="rounded overflow-hidden bg-slate-800 p-2">
              <img src={s.url} alt={`snap-${i}`} className="w-full h-auto object-contain" />
              {s.createdAt && (
                <figcaption className="text-xs text-slate-400 mt-1">
                  {new Date(s.createdAt).toLocaleString()}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </main>
  );
}
