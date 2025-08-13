'use client'

import React, { useEffect, useRef, useState } from "react";

type Candle = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

type Trade = {
    id: number;
    side: "BUY" | "SELL";
    entryPrice: number;
    exitPrice?: number;
    qty: number;
    pnl?: number;
    entryTime: number;
    exitTime?: number;
};

export default function Bot() {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const [connected, setConnected] = useState(false);
    const [statusText, setStatusText] = useState("idle");
    const [lastPrice, setLastPrice] = useState<number | null>(null);
    const [closes, setCloses] = useState<number[]>([]);
    const [sma20, setSma20] = useState<number | null>(null);
    const [sma50, setSma50] = useState<number | null>(null);
    const [signal, setSignal] = useState<"BUY" | "SELL" | "HOLD">("HOLD");

    const [capital, setCapital] = useState<number>(100); // USDT
    const riskPercent = 0.01; // 1% risk per trade
    const stopLossPct = 0.01; // 1% stop loss
    const takeProfitPct = 0.02; // 2% take profit

    const [position, setPosition] = useState<{
        side: "LONG";
        entryPrice: number;
        qty: number;
        stopLoss: number;
        takeProfit: number;
        entryTime: number;
    } | null>(null);

    const [trades, setTrades] = useState<Trade[]>([]);
    const tradeId = useRef<number>(1);

    // helpers
    const sma = (arr: number[], period: number) => {
        if (arr.length < period) return null;
        const slice = arr.slice(-period);
        const sum = slice.reduce((a, b) => a + b, 0);
        return sum / period;
    };

    // safe parse: OKX sometimes sends plain "pong" / "ping" or other strings
    const tryParse = (data: any) => {
        if (typeof data !== "string") return null;
        const trimmed = data.trim();
        if (!trimmed) return null;
        if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return null;
        try {
            return JSON.parse(trimmed);
        } catch {
            return null;
        }
    };

    useEffect(() => {
        let shouldUnmount = false;
        let backoff = 1000;
        const connect = () => {
            setStatusText("connecting");
            const ws = new WebSocket("wss://ws.okx.com:8443/ws/v5/public");
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("✅ WebSocket connected");
                setConnected(true);
                setStatusText("connected");
                backoff = 1000;
                // subscribe to 1m candles for BTC-USDT
                try {
                    ws.send(
                        JSON.stringify({
                            op: "subscribe",
                            args: [{ channel: "candle1m", instId: "BTC-USDT" }],
                        })
                    );
                    console.log("📡 Subscribed to candle1m BTC-USDT");
                } catch (e) {
                    console.warn("subscribe send failed", e);
                }
            };

            ws.onmessage = (ev) => {
                // ignore non-strings quickly
                if (typeof ev.data !== "string") {
                    // sometimes binary - ignore
                    return;
                }

                // ignore direct pings/pongs which are not JSON
                const trimmed = ev.data.trim();
                if (trimmed === "ping" || trimmed === "pong") {
                    // OKX may send ping/pong keepalives
                    // reply if server asks? not necessary for this client
                    return;
                }

                const parsed = tryParse(ev.data);
                if (!parsed) {
                    // not JSON or couldn't parse
                    return;
                }

                // handle error events
                if (parsed.event === "error" || parsed.code) {
                    // log server-side error (e.g. wrong channel)
                    console.warn("WS server message:", parsed);
                    return;
                }

                // OKX format for subscribed market data: { arg: {...}, data: [...] }
                // we only care about candle1m
                try {
                    if (parsed.arg?.channel === "candle1m" && Array.isArray(parsed.data)) {
                        // parsed.data is array of kline arrays. Each kline: [ts, open, high, low, close, vol, ...maybe more]
                        const entries = parsed.data as any[];
                        // Keep only time and OHLCV
                        const klineEntries: Candle[] = entries.map((k) => {
                            // OKX sometimes returns string timestamps or ISO strings, but usually epoch in ms
                            const timeVal = Number(k[0]);
                            return {
                                time: Number(timeVal),
                                open: Number(k[1]),
                                high: Number(k[2]),
                                low: Number(k[3]),
                                close: Number(k[4]),
                                volume: Number(k[5]),
                            };
                        });

                        // Update closes and indicators using the latest candle(s)
                        setCloses((prev) => {
                            // merge while avoiding duplicates by time
                            const mergedMap = new Map<number, Candle>();
                            for (const c of prev.map((v, i) => ({ time: i, close: v }))) {
                                // not used — we will base on prev array directly below
                            }

                            // Build an updated list: copy prev into object list with time unknown -> we will just append, then dedupe by time
                            const prevCandles: Candle[] = prev.map((closeVal, idx) => ({
                                time: Date.now() - (prev.length - idx) * 60000,
                                open: closeVal,
                                high: closeVal,
                                low: closeVal,
                                close: closeVal,
                                volume: 0,
                            }));

                            // simpler approach: append new closes and dedupe by last N items
                            const appended = [...prev, ...klineEntries.map((c) => c.close)];
                            // dedupe contiguous duplicates (rare)
                            const deduped: number[] = [];
                            for (let i = 0; i < appended.length; i++) {
                                const v = appended[i];
                                if (deduped.length === 0 || deduped[deduped.length - 1] !== v) deduped.push(v);
                            }
                            const maxLen = 1000;
                            const result = deduped.slice(-maxLen);

                            // compute SMAs and last price
                            const s20 = sma(result, 20);
                            const s50 = sma(result, 50);
                            setSma20(s20);
                            setSma50(s50);
                            setLastPrice(result[result.length - 1] ?? null);

                            // determine crossover signal more robustly by looking at previous values
                            if (s20 !== null && s50 !== null && result.length >= 51) {
                                // compute prev (one candle earlier)
                                const prevS20 = sma(result.slice(0, -1), 20);
                                const prevS50 = sma(result.slice(0, -1), 50);
                                if (prevS20 !== null && prevS50 !== null) {
                                    if (prevS20 <= prevS50 && s20 > s50) {
                                        // golden cross
                                        setSignal("BUY");
                                        // enter position if not already
                                        tryEnterPosition(result[result.length - 1]);
                                    } else if (prevS20 >= prevS50 && s20 < s50) {
                                        // death cross
                                        setSignal("SELL");
                                        tryExitPosition(result[result.length - 1], "signal");
                                    } else {
                                        setSignal("HOLD");
                                        checkStops(result[result.length - 1]);
                                    }
                                } else {
                                    setSignal("HOLD");
                                }
                            } else {
                                setSignal("HOLD");
                            }

                            return result;
                        });
                    } else {
                        // the message could be a confirmation of subscribe, or other info - ignore
                        // console.debug("WS msg (ignored):", parsed);
                    }
                } catch (err) {
                    console.error("Error handling WS parsed message:", err);
                }
            };

            ws.onclose = (ev) => {
                setConnected(false);
                setStatusText("disconnected");
                console.warn("WebSocket closed", ev);
                if (shouldUnmount) return;
                // reconnect with exponential backoff
                if (reconnectTimeoutRef.current) window.clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = window.setTimeout(() => {
                    connect();
                }, backoff);
                backoff = Math.min(backoff * 2, 30000);
            };

            ws.onerror = (err) => {
                console.error("WebSocket error", err);
                // close to trigger reconnect
                try {
                    ws.close();
                } catch { }
            };
        };

        connect();

        return () => {
            shouldUnmount = true;
            if (reconnectTimeoutRef.current) window.clearTimeout(reconnectTimeoutRef.current);
            try {
                wsRef.current?.close();
            } catch { }
        };

    }, []);


    // Trading simulation helpers
    const tryEnterPosition = (price: number) => {
        if (position) return; // one position at a time
        if (!price || !isFinite(price)) return;
        const riskAmount = capital * riskPercent; // USDT risked
        const stopLossDistance = price * stopLossPct; // USDT distance per unit price
        if (stopLossDistance <= 0) return;
        const qty = riskAmount / stopLossDistance;
        if (!isFinite(qty) || qty <= 0) return;
        const stopLossPrice = price - stopLossDistance;
        const takeProfitPrice = price + price * takeProfitPct;

        const newPos = {
            side: "LONG" as const,
            entryPrice: price,
            qty,
            stopLoss: stopLossPrice,
            takeProfit: takeProfitPrice,
            entryTime: Date.now(),
        };
        setPosition(newPos);
        setTrades((t) => [
            ...t,
            {
                id: tradeId.current++,
                side: "BUY",
                entryPrice: price,
                qty,
                entryTime: Date.now(),
            },
        ]);
        console.log("Entered LONG", newPos);
    };


    const tryExitPosition = (price: number, reason: "signal" | "stop" | "tp" = "signal") => {
        if (!position) return;
        if (!price || !isFinite(price)) return;
        const entryPrice = position.entryPrice;
        const qty = position.qty;
        const pnl = (price - entryPrice) * qty;
        const feePct = 0.0005; // simple fee model
        const fees = (Math.abs(price * qty) + Math.abs(entryPrice * qty)) * feePct;
        const pnlNet = pnl - fees;

        setCapital((cap) => Number((cap + pnlNet).toFixed(8)));
        setTrades((t) => [
            ...t,
            {
                id: tradeId.current++,
                side: "SELL",
                entryPrice,
                exitPrice: price,
                qty,
                pnl: Number(pnlNet.toFixed(8)),
                entryTime: position.entryTime,
                exitTime: Date.now(),
            },
        ]);
        console.log("Exited position:", { entryPrice, exitPrice: price, qty, pnlNet, reason });
        setPosition(null);
        setSignal("HOLD");
    };


    const checkStops = (price: number) => {
        if (!position) return;
        if (price <= position.stopLoss) {
            tryExitPosition(position.stopLoss, "stop");
        } else if (price >= position.takeProfit) {
            tryExitPosition(position.takeProfit, "tp");
        }
    };

    const resetAll = () => {
        setCloses([]);
        setSma20(null);
        setSma50(null);
        setLastPrice(null);
        setSignal("HOLD");
        setPosition(null);
        setTrades([]);
        setCapital(100);
        tradeId.current = 1;
    };

    return (
        <div style={{ margin: 8, padding: 14, fontFamily: "Inter, Roboto, sans-serif", color: "#e6eef8", background: "#05060a", minHeight: "100vh" }}>
            <h1 style={{ margin: 0, marginBottom: 8 }}>okx-tracker — mini SMA bot (demo)</h1>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                <div style={{ padding: 10, background: "#0b1220", borderRadius: 8 }}>
                    <div><b>WS:</b> {connected ? <span style={{ color: "#7df29b" }}>connected</span> : <span style={{ color: "#f17d7d" }}>{statusText}</span>}</div>
                    <div><b>Pair:</b> BTC-USDT (1m)</div>
                </div>

                <div style={{ padding: 10, background: "#071226", borderRadius: 8 }}>
                    <div><b>Last price:</b> {lastPrice ? lastPrice.toFixed(2) : "—"}</div>
                    <div><b>SMA20:</b> {sma20 ? sma20.toFixed(2) : "—"}</div>
                    <div><b>SMA50:</b> {sma50 ? sma50.toFixed(2) : "—"}</div>
                </div>

                <div style={{ padding: 10, background: "#071226", borderRadius: 8 }}>
                    <div><b>Signal:</b> <span style={{ color: signal === "BUY" ? "#7df29b" : signal === "SELL" ? "#ff8a8a" : "#cbd5e1" }}>{signal}</span></div>
                    <div><b>Capital (USDT):</b> {capital.toFixed(6)}</div>
                    <div><b>Open position:</b> {position ? `LONG ${position.qty.toFixed(8)} @ ${position.entryPrice.toFixed(2)}` : "none"}</div>
                </div>

                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button onClick={resetAll} style={{ padding: "8px 12px", borderRadius: 8, background: "#2a2f3a", color: "#fff", border: "none" }}>Reset</button>
                    <button onClick={() => { wsRef.current?.close(); setStatusText("manual reconnect"); setTimeout(() => { setStatusText("reconnecting"); /* reconnect effect handles it */ }, 200); }} style={{ padding: "8px 12px", borderRadius: 8, background: "#284b8f", color: "#fff", border: "none" }}>Reconnect</button>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 12 }}>
                <div style={{ padding: 12, background: "#071226", borderRadius: 8 }}>
                    <h3 style={{ marginTop: 0 }}>Recent closes (last {closes.length})</h3>
                    <div style={{ maxHeight: 360, overflow: "auto", fontSize: 13 }}>
                        {closes.slice().reverse().map((c, idx) => (
                            <div key={idx} style={{ padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                <span style={{ width: 120, display: "inline-block" }}>{c.toFixed(2)}</span>
                                <span style={{ marginLeft: 12, color: "#9aa4b2" }}>{idx === 0 ? "latest" : ""}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ padding: 12, background: "#071226", borderRadius: 8 }}>
                    <h3 style={{ marginTop: 0 }}>Trades / Log</h3>
                    <div style={{ maxHeight: 360, overflow: "auto", fontSize: 13 }}>
                        {trades.slice().reverse().map((t) => (
                            <div key={t.id} style={{ padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                <div><b>{t.side}</b> {t.qty?.toFixed(8)} @ {t.entryPrice?.toFixed(2)}</div>
                                {t.exitPrice && <div style={{ color: t.pnl && t.pnl >= 0 ? "#7df29b" : "#ff8a8a" }}>exit {t.exitPrice.toFixed(2)} PnL: {t.pnl?.toFixed(6)}</div>}
                                <div style={{ color: "#9aa4b2", fontSize: 12 }}>{new Date(t.entryTime).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 14, padding: 12, background: "#071226", borderRadius: 8 }}>
                <h3 style={{ marginTop: 0 }}>Notes</h3>
                <ul style={{ marginTop: 0 }}>
                    <li>Risk per trade: {riskPercent * 100}%</li>
                    <li>Stop loss: {stopLossPct * 100}% | Take profit: {takeProfitPct * 100}%</li>
                    <li>This is a demo simulator — no real orders are placed.</li>
                </ul>
            </div>
        </div>
    );
}