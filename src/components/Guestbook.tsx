"use client";

import { useEffect, useState } from "react";
import { addGuestbookEntry, fetchGuestbook } from "@/lib/api";
import type { GuestbookEntry } from "@/lib/types";

export default function Guestbook() {
    const [items, setItems] = useState<GuestbookEntry[]>([]);
    const [name, setName] = useState("");
    const [text, setText] = useState("");

    async function load() {
        const r = await fetchGuestbook();
        setItems(r);
    }
    useEffect(() => { load(); }, []);

    async function submit() {
        if (!text.trim()) return;
        await addGuestbookEntry(name.trim() || "Анонім", text.trim());
        setText("");
        load();
    }

    return (
        <div className="rounded-2xl bg-white/70 backdrop-blur p-4 shadow-soft">
            <div className="text-sm text-slate-600 mb-2">Гостьова книга</div>
            <div className="flex gap-2">
                <input className="rounded border px-2 py-1" placeholder="Ім’я" value={name} onChange={e => setName(e.target.value)} />
                <input className="flex-1 rounded border px-2 py-1" placeholder="Повідомлення" value={text} onChange={e => setText(e.target.value)} />
                <button onClick={submit} className="rounded bg-emerald-600 text-white px-3 py-1 text-sm">Додати</button>
            </div>
            <ul className="mt-3 space-y-2">
                {items.map((it, i) => (
                    <li key={i} className="rounded bg-white/60 p-2 text-sm">
                        <div className="text-slate-500 text-xs">{new Date(it.createdAt).toLocaleString()}</div>
                        <div><b>{it.name}:</b> {it.text}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
