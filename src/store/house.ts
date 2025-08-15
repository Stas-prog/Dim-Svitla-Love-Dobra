"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { HouseState } from "@/lib/types";

type HouseStore = {
    localState: HouseState | null;
    setLocalState: (s: HouseState) => void;
    reset: () => void;
};

export const useHouseStore = create<HouseStore>()(
    persist(
        (set) => ({
            localState: null,
            setLocalState: (s) => set({ localState: s }),
            reset: () => set({ localState: null }),
        }),
        {
            name: "dim-svitla-house",
            storage: createJSONStorage(() => localStorage),
            version: 1,
        }
    )
);
