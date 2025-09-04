"use client";
import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      // 1) заливаємо у Cloudinary (unsigned)
      const f = new FormData();
      f.append("file", file);
      f.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
      const up = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST", body: f,
      });
      const res = await up.json();
      if (!res.secure_url) throw new Error("Upload failed");

      // 2) зберігаємо URL у Mongo
      await fetch("/api/slides", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: res.secure_url, caption }),
      });

      setMsg("✅ Готово! Фото з’явиться в слайд-шоу.");
      setFile(null); setCaption("");
    } catch (e:any) {
      setMsg("❌ Помилка завантаження. " + (e?.message || ""));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-md p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Завантажити фото</h1>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm"
        />

        <input
          type="text"
          value={caption}
          onChange={(e)=>setCaption(e.target.value)}
          placeholder="Підпис (необов’язково)"
          className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2"
        />

        <button
          onClick={handleUpload}
          disabled={!file || busy}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
        >
          {busy ? "Завантажую…" : "Завантажити"}
        </button>

        {msg && <p className="text-sm text-slate-300">{msg}</p>}
      </div>
    </main>
  );
}
