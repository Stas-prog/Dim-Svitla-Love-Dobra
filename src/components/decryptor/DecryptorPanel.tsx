"use client";
import React, { useState } from "react";

export default function DecryptorPanel() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask() {
    setBusy(true); setAnswer(null);
    try {
      const res = await fetch("/api/decrypt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setAnswer(data.answer ?? "…");
    } catch {
      setAnswer("Помилка мережі. Спробуй ще.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        rows={3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Запитай: «Опиши настрій кадру», «Що спільного на фото?»…"
        className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <div className="flex gap-2">
        <button onClick={ask} disabled={busy}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60">
          {busy ? "Думаю…" : "Запитати"}
        </button>
        <button onClick={() => { setPrompt(""); setAnswer(null); }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700">
          Очистити
        </button>
      </div>
      <div className="min-h-16 rounded-lg border border-slate-800 p-3 bg-slate-900/40">
        {answer ? <p className="whitespace-pre-wrap">{answer}</p>
                : <p className="text-slate-400">Відповідь з’явиться тут.</p>}
      </div>
    </div>
  );
}
