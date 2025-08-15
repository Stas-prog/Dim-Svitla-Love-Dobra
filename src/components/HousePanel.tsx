"use client";

import { useEffect, useState } from "react";
import { fetchHouse, saveHouse } from "@/lib/api";
import type { HouseState } from "@/lib/types";
import { useHouseStore } from "@/store/house";

export default function HousePanel() {
    const { localState, setLocalState } = useHouseStore();
    const [loading, setLoading] = useState(false);
    const [state, setState] = useState<HouseState>({
        _id: "home",
        theme: "dawn",
        messageOfTheDay: "",
    });

    useEffect(() => {
        (async () => {
            setLoading(true);
            const s = (await fetchHouse()) as HouseState;
            if (s && s._id) { setState(s); setLocalState(s); }
            setLoading(false);
        })();
    }, [setLocalState]);

    async function onSave() {
        setLoading(true);
        await saveHouse(state);
        setLocalState({ ...state, updatedAt: new Date().toISOString() });
        setLoading(false);
    }

    return (
        <div className="rounded-2xl bg-white/70 backdrop-blur p-4 shadow-soft">
            <div className="text-sm text-slate-600 mb-2">
                Стан дому {loading && <span>· зберігаємо/завантажуємо…</span>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                    Тема:
                    <select
                        value={state.theme}
                        onChange={(e) => setState(s => ({ ...s, theme: e.target.value as HouseState["theme"] }))}
                        className="ml-2 rounded border px-2 py-1"
                    >
                        <option value="light">light</option>
                        <option value="dark">dark</option>
                        <option value="dawn">dawn</option>
                        <option value="space">space</option>
                    </select>
                </label>
                <label className="text-sm">
                    Повідомлення дня:
                    <input
                        className="ml-2 rounded border px-2 py-1 w-full"
                        value={state.messageOfTheDay ?? ""}
                        onChange={(e) => setState(s => ({ ...s, messageOfTheDay: e.target.value }))}
                        placeholder="Лагідний промінчик для всіх ✨"
                    />
                </label>
            </div>
            <button
                onClick={onSave}
                className="mt-3 rounded-lg bg-slate-900 text-white px-3 py-1 text-sm"
            >
                Зберегти
            </button>

            {localState && (
                <div className="mt-3 text-xs text-slate-600">
                    Локальний снапшот: <code>{localState.updatedAt ?? "—"}</code>
                </div>
            )}
        </div>
    );
}
