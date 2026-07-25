export type HouseState = {
    _id: string;                 // напр. "home"
    theme?: "light" | "dark" | "dawn" | "space";
    messageOfTheDay?: string;
    updatedAt?: string;
};

export type GuestbookEntry = {
    _id?: string;
    name: string;
    text: string;
    createdAt: string;
};

export type BotSnapshot = {
    _id: string;                 // напр. "bot"
    status: "idle" | "running" | "paused";
    notes?: string;
    updatedAt: string;
};
