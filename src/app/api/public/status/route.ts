// src/app/api/public/status/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

// ---- типи документів з рядковим _id ----
type StateDoc = {
    _id: string;                 // "sim"
    instId?: string;
    tf?: "1m" | "5m" | "15m";
    sim?: any;
    candles?: any[];
    updatedAt?: string;
};

type SettingsDoc = {
    _id: string;                 // "bot-settings"
    emaFast: number;
    emaSlow: number;
    takeProfit: number;
    stopLoss: number;
    feeRate: number;
    slippage: number;
    maxBars: number;
    updatedAt: string;
};

type LeaseDoc = {
    _id: string;                 // "sim-lease"
    holderId: string;
    until: string;               // ISO string ок
    updatedAt: string;
};

type HouseState = {
    _id: string;                 // "home"
    theme?: "light" | "dark" | "dawn" | "space";
    messageOfTheDay?: string;
    updatedAt?: string;
};

export async function GET() {
    const db = await getDb();

    // колекції з коректними дженериками (_id: string)
    const stateCol = db.collection<StateDoc>("state");
    const settingsCol = db.collection<SettingsDoc>("settings");
    const leaseCol = db.collection<LeaseDoc>("leases");
    const houseCol = db.collection<HouseState>("house_state");

    const [state, settings, lease, house] = await Promise.all([
        stateCol.findOne({ _id: "sim" }),
        settingsCol.findOne({ _id: "bot-settings" }),
        leaseCol.findOne({ _id: "sim-lease" }),
        houseCol.findOne({ _id: "home" }),
    ]);

    // обрізаємо важкі поля перед публікацією
    const safeState = state
        ? {
            _id: state._id,
            instId: state.instId,
            tf: state.tf,
            sim: state.sim
                ? {
                    cashUSDT: state.sim.cashUSDT,
                    equityUSDT: state.sim.equityUSDT,
                    position: state.sim.position ?? null,
                    tradesCount: Array.isArray(state.sim.trades) ? state.sim.trades.length : 0,
                    lastClosedTs: state.sim.lastClosedTs ?? null,
                }
                : null,
            candlesCount: Array.isArray(state.candles) ? state.candles.length : 0,
            updatedAt: state.updatedAt ?? null,
        }
        : null;

    return NextResponse.json({
        ok: true,
        at: new Date().toISOString(),
        house: house
            ? { theme: house.theme, motd: house.messageOfTheDay, updatedAt: house.updatedAt }
            : null,
        settings: settings
            ? {
                emaFast: settings.emaFast,
                emaSlow: settings.emaSlow,
                takeProfit: settings.takeProfit,
                stopLoss: settings.stopLoss,
                feeRate: settings.feeRate,
                slippage: settings.slippage,
                maxBars: settings.maxBars,
                updatedAt: settings.updatedAt,
            }
            : null,
        lease: lease ? { holderId: lease.holderId, until: lease.until, updatedAt: lease.updatedAt } : null,
        state: safeState,
    });
}
