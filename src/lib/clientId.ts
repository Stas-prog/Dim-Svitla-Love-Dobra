// зберігаємо стабільний clientId у localStorage
export function getClientId(): string {
    if (typeof window === "undefined") return "server";
    const key = "vision-client-id";
    let id = localStorage.getItem(key);
    if (!id) {
        id = typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : String(Date.now()) + Math.random().toString(16).slice(2);
        localStorage.setItem(key, id);
    }
    return id;
}
