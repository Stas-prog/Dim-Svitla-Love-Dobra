import type { HouseState, GuestbookEntry, BotSnapshot } from "./types";

export async function fetchHouse(): Promise<HouseState | {}> {
    const r = await fetch("/api/house", { cache: "no-store" });
    return r.json();
}
export async function saveHouse(p: Partial<HouseState>) {
    await fetch("/api/house", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(p),
    });
}

export async function fetchGuestbook(): Promise<GuestbookEntry[]> {
    const r = await fetch("/api/guestbook", { cache: "no-store" });
    return r.json();
}
export async function addGuestbookEntry(name: string, text: string) {
    await fetch("/api/guestbook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, text }),
    });
}

export async function fetchBot(): Promise<BotSnapshot | {}> {
    const r = await fetch("/api/bot", { cache: "no-store" });
    return r.json();
}
export async function saveBot(p: Partial<BotSnapshot>) {
    await fetch("/api/bot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(p),
    });
}
