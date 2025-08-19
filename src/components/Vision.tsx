'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Peer, { SignalData } from 'simple-peer';
import { getClientId } from '@/lib/clientId';

type Mode = 'host' | 'viewer';

type OfferPayload = { type: 'offer'; sdp: any };
type AnswerPayload = { type: 'answer'; sdp: any };
type IcePayload = { type: 'candidate'; candidate: RTCIceCandidateInit };

function asSignal(x: any): SignalData {
    try { return typeof x === 'string' ? JSON.parse(x) : x; } catch { return x; }
}

export default function Vision({
    initialMode,
    initialRoomId,
}: { initialMode?: Mode; initialRoomId?: string }) {
    const [mode, setMode] = useState<Mode>(initialMode || 'viewer');
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [err, setErr] = useState<string | null>(null);

    const [roomId, setRoomId] = useState<string>(() => {
        if (initialRoomId) return initialRoomId;
        if (typeof window !== 'undefined') {
            return new URLSearchParams(location.search).get('roomId') || '';
        }
        return '';
    });

    const isHost = mode === 'host';

    const clientIdRef = useRef<string>('');
    const peerRef = useRef<Peer.Instance | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const offerAppliedRef = useRef(false);
    const answerAppliedRef = useRef(false);
    const iceSeenRef = useRef<Set<string>>(new Set());

    const pollOfferTimer = useRef<number | null>(null);
    const pollAnswerTimer = useRef<number | null>(null);
    const pollIceTimer = useRef<number | null>(null);

    const startingRef = useRef(false); // анти-даблклік

    function clearTimers() {
        if (pollOfferTimer.current) { clearInterval(pollOfferTimer.current); pollOfferTimer.current = null; }
        if (pollAnswerTimer.current) { clearInterval(pollAnswerTimer.current); pollAnswerTimer.current = null; }
        if (pollIceTimer.current) { clearInterval(pollIceTimer.current); pollIceTimer.current = null; }
    }

    function destroyPeer() {
        try { peerRef.current?.destroy(); } catch { }
        peerRef.current = null;
        offerAppliedRef.current = false;
        answerAppliedRef.current = false;
        iceSeenRef.current.clear();
    }

    function stopMedia() {
        try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
        streamRef.current = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }

    function resetAll() {
        clearTimers();
        destroyPeer();
        stopMedia();
        setStatus('idle');
        setErr(null);
        startingRef.current = false;
    }

    // cleanup тільки на unmount
    useEffect(() => {
        return () => resetAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        clientIdRef.current = getClientId();
    }, []);

    async function start() {
        if (startingRef.current || status === 'connecting') return;
        startingRef.current = true;
        setErr(null);
        setStatus('connecting');

        try {
            // використовуємо локальний rid, НЕ міняючи стейт під час старту
            const rid = (roomId && roomId.trim()) ? roomId.trim() : crypto.randomUUID();

            const peer = new Peer({
                initiator: isHost,
                trickle: true,
            });
            peerRef.current = peer;

            if (isHost) {
                // хост вмикає камеру та додає треки
                let media: MediaStream | null = null;
                try {
                    media = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                } catch (e: any) {
                    console.error('getUserMedia error', e);
                    setErr(e?.message || 'getUserMedia failed');
                    setStatus('error');
                    startingRef.current = false;
                    return;
                }
                // якщо під час очікування щось зламали — відступаємо
                if (peerRef.current !== peer || peer.destroyed) {
                    media.getTracks().forEach(t => t.stop());
                    startingRef.current = false;
                    return;
                }
                streamRef.current = media;
                if (localVideoRef.current) localVideoRef.current.srcObject = media;
                // захист від destroy
                if (!peer.destroyed) {
                    media.getTracks().forEach(t => {
                        try { peer.addTrack(t, media!); } catch { }
                    });
                }
            } else {
                // viewer слухає віддалений стрім
                peer.on('track', (_track, remoteStream) => {
                    const el = remoteVideoRef.current;
                    if (!el) return;
                    el.srcObject = remoteStream;
                    el.play().catch(() => { });
                });
            }

            peer.on('connect', () => {
                console.log('[peer] connected');
                setStatus('connected');
                startingRef.current = false;
            });
            peer.on('error', (e) => {
                console.error('[peer] error', e);
                setErr(e.message || 'peer error');
                setStatus('error');
                startingRef.current = false;
            });
            peer.on('close', () => {
                console.log('[peer] close');
                setStatus('idle');
                startingRef.current = false;
            });

            // вихідні сигнали -> API
            peer.on('signal', async (data: SignalData) => {
                try {
                    if ((data as any).type === 'offer') {
                        const payload: OfferPayload = { type: 'offer', sdp: data };
                        const res = await fetch('/api/webrtc/offer', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ roomId: rid, offer: payload, from: clientIdRef.current }),
                            cache: 'no-store',
                        });
                        if (!res.ok) throw new Error('offer save failed');
                    } else if ((data as any).type === 'answer') {
                        const payload: AnswerPayload = { type: 'answer', sdp: data };
                        const res = await fetch('/api/webrtc/answer', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ roomId: rid, answer: payload, from: clientIdRef.current }),
                            cache: 'no-store',
                        });
                        if (!res.ok) throw new Error('answer save failed');
                    } else if ((data as any).candidate) {
                        const candInit = (data as any).candidate as RTCIceCandidateInit;
                        const key = `${candInit.sdpMid || ''}|${candInit.sdpMLineIndex || ''}|${candInit.candidate || ''}`;
                        if (iceSeenRef.current.has(key)) return;
                        iceSeenRef.current.add(key);

                        const payload: IcePayload = { type: 'candidate', candidate: candInit };
                        const res = await fetch('/api/webrtc/candidate', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ roomId: rid, ice: payload, from: clientIdRef.current }),
                            cache: 'no-store',
                        });
                        if (!res.ok) throw new Error('ice save failed');
                    }
                } catch (e: any) {
                    console.error('[signal POST] error', e);
                    setErr(e.message || 'signal post error');
                }
            });

            // ---- polling ----
            clearTimers();

            if (!isHost) {
                // viewer: чекає offer
                const pollOffer = async () => {
                    try {
                        if (offerAppliedRef.current) return;
                        const r = await fetch(`/api/webrtc/offer?roomId=${encodeURIComponent(rid)}`, { cache: 'no-store' });
                        if (!r.ok) return;
                        const doc = await r.json();
                        if (doc?.offer?.sdp) {
                            const sig = asSignal(doc.offer.sdp);
                            if (sig?.type === 'offer' && !offerAppliedRef.current && peerRef.current && !peerRef.current.destroyed) {
                                peerRef.current.signal(sig);
                                offerAppliedRef.current = true;
                            }
                        }
                    } catch { }
                };
                pollOffer();
                pollOfferTimer.current = window.setInterval(pollOffer, 1200) as unknown as number;
            }

            if (isHost) {
                // host: чекає answer
                const pollAnswer = async () => {
                    try {
                        if (answerAppliedRef.current) return;
                        const r = await fetch(`/api/webrtc/answer?roomId=${encodeURIComponent(rid)}&to=${encodeURIComponent(clientIdRef.current)}`, { cache: 'no-store' });
                        if (!r.ok) return;
                        const doc = await r.json();
                        if (doc?.answer?.sdp) {
                            const sig = asSignal(doc.answer.sdp);
                            if (sig?.type === 'answer' && !answerAppliedRef.current && peerRef.current && !peerRef.current.destroyed) {
                                peerRef.current.signal(sig);
                                answerAppliedRef.current = true;
                            }
                        }
                    } catch { }
                };
                pollAnswer();
                pollAnswerTimer.current = window.setInterval(pollAnswer, 1200) as unknown as number;
            }

            const pollIce = async () => {
                try {
                    const r = await fetch(`/api/webrtc/candidate?roomId=${encodeURIComponent(rid)}&to=${encodeURIComponent(clientIdRef.current)}`, { cache: 'no-store' });
                    if (!r.ok) return;
                    const list = await r.json();
                    if (!Array.isArray(list)) return;
                    for (const it of list) {
                        const c: RTCIceCandidateInit | undefined = it?.ice?.candidate;
                        if (!c) continue;
                        const key = `${c.sdpMid || ''}|${c.sdpMLineIndex || ''}|${c.candidate || ''}`;
                        if (iceSeenRef.current.has(key)) continue;
                        iceSeenRef.current.add(key);

                        if (peerRef.current && !peerRef.current.destroyed) {
                            const rtc = new RTCIceCandidate(c);
                            const sig = { type: 'candidate', candidate: rtc } as unknown as SignalData;
                            peerRef.current.signal(sig);
                        }
                    }
                } catch { }
            };
            pollIce();
            pollIceTimer.current = window.setInterval(pollIce, 1000) as unknown as number;

            // тільки після успішного запуску — синхронізуємо roomId у стейт/URL (без тригеру destroy)
            if (!roomId) setRoomId(rid);

        } catch (e: any) {
            console.error('start error', e);
            setErr(e.message || 'start error');
            setStatus('error');
        } finally {
            // залишаємо в true поки не зʼєднаємось/помилка подіями peer; тут не скидаємо насильно
        }
    }

    function disconnect() {
        resetAll();
    }

    async function captureToMongo() {
        try {
            const video = isHost ? localVideoRef.current : remoteVideoRef.current;
            if (!video) throw new Error('video element not ready');
            const w = video.videoWidth || 640;
            const h = video.videoHeight || 360;
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('canvas ctx failed');
            ctx.drawImage(video, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            const res = await fetch('/api/vision/capture', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomId || 'no-room',
                    by: clientIdRef.current,
                    dataUrl,
                    createdAt: new Date().toISOString(),
                }),
            });
            if (!res.ok) throw new Error('capture save failed');
            alert('📸 Збережено в Mongo!');
        } catch (e: any) {
            setErr(e.message || 'capture error');
        }
    }

    const subtitle = useMemo(() => (isHost ? 'host' : 'viewer'), [isHost]);

    return (
        <div className="rounded-2xl bg-white/80 p-4 shadow-soft text-slate-900 card">
            <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded bg-slate-100 text-xs text-slate-950">{subtitle}</span>
                <span className={`px-2 py-1 rounded text-xs ${status === 'connected' ? 'bg-emerald-100 text-emerald-700' : status === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                    status: {status}
                </span>
                {err && <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 text-xs">ERR: {err}</span>}
                <div className="ml-auto flex gap-2">
                    <button
                        className="px-3 py-1 rounded bg-slate-900 text-white text-sm"
                        onClick={() => setMode(m => (m === 'host' ? 'viewer' : 'host'))}
                        disabled={status === 'connecting'}
                        title="Перемкнути режим"
                    >
                        Режим: {isHost ? 'Хост' : 'Глядач'}
                    </button>
                    <button
                        className="px-3 py-1 rounded bg-indigo-600 text-white text-sm disabled:opacity-50"
                        onClick={start}
                        disabled={status === 'connecting'}
                    >
                        Підключити
                    </button>
                    <button
                        className="px-3 py-1 rounded bg-slate-200 text-slate-800 text-sm"
                        onClick={disconnect}
                    >
                        Від’єднати
                    </button>
                </div>
            </div>

            <div className="flex gap-2 items-center mb-3">
                <input
                    className="px-2 py-1 rounded border border-slate-300 bg-white text-sm w-[340px]"
                    placeholder="roomId"
                    value={roomId || ''}
                    onChange={e => setRoomId(e.target.value)}
                />
                <a
                    className="text-indigo-700 underline text-sm"
                    href={`/vision/linked?roomId=${encodeURIComponent(roomId || '')}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    Посилання для глядача
                </a>
                <button
                    className="ml-auto px-3 py-1 rounded bg-amber-500 text-white text-sm disabled:opacity-50"
                    onClick={captureToMongo}
                    disabled={status !== 'connected'}
                    title="Зберегти кадр у Mongo"
                >
                    📸 Зробити фото в Mongo
                </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-50 p-2">
                    <div className="text-xs text-slate-600 mb-1">Local (host)</div>
                    <video ref={localVideoRef} className="w-full rounded" playsInline autoPlay muted />
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                    <div className="text-xs text-slate-600 mb-1">Remote (viewer)</div>
                    <video ref={remoteVideoRef} className="w-full rounded" playsInline autoPlay />
                </div>
            </div>
        </div>
    );
}
