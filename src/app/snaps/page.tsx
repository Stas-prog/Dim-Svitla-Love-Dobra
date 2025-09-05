export const dynamic = "force-dynamic";

type RoomsResp = { ok: boolean; items: { roomId: string; lastUploadedAt: string | null }[] };

async function getRooms(): Promise<RoomsResp["items"]> {
  // відносний запит, щоб не залежати від BASE_URL
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/vision/rooms`, { cache: "no-store" });
  if (!res.ok) return [];
  const j = (await res.json()) as RoomsResp | any;
  return Array.isArray(j?.items) ? j.items : [];
}

export default async function SnapsIndexPage() {
  const rooms = await getRooms();

  return (
    <main className="min-h-screen p-6 bg-slate-900 text-slate-50">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🗂 Галереї кімнат</h1>

        {rooms.length === 0 && (
          <div className="text-slate-300 text-sm">
            Поки порожньо. Зроби фото у Vision — і тут з’являться кімнати.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => (
            <a
              key={r.roomId}
              href={`/snaps/${encodeURIComponent(r.roomId)}`}
              className="block rounded-lg border border-slate-700 bg-slate-800 p-3 hover:bg-slate-700 transition"
            >
              <div className="font-mono text-xs break-all">{r.roomId}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {r.lastUploadedAt ? new Date(r.lastUploadedAt).toLocaleString() : "—"}
              </div>
              <div className="text-xs text-sky-300 mt-2 underline">Перейти до фото</div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
