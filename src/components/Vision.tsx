'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Peer, { SignalData } from 'simple-peer';
import { getClientId } from '@/lib/clientId';

type Mode = 'host' | 'viewer';

type OfferPayload = { type: 'offer'; sdp: any };
type AnswerPayload = { type: 'answer'; sdp: any };
type IcePayload = { type: 'candidate'; candidate: RTCIceCandidateInit };

function asSignal(x: any): SignalData {
    try {
        if (!x) return x;
        if (typeof x === 'string') return JSON.parse(x);
        return x;
    } catch { return x; }
}

export default function Vision({
    initialMode,
    initialRoomId,
}: { initialMode?: Mode; initialRoomId?: string }) {
    // -------------------- state --------------------
    const [mode, setMode] = useState<Mode>(initialMode || 'viewer');
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [err, setErr] = useState<string | null>(null);

    const [roomId, setRoomId] = useState<string>(
        initialRoomId || (typeof window !== 'undefined' ? (new URLSearchParams(location.search).get('roomId') || '') : '')
    );

    const isHost = mode === 'host';

    // -------------------- refs --------------------
    const clientIdRef = useRef<string>('');
    const peerRef = useRef<Peer.Instance | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    // захист від дублювань
    const offerAppliedRef = useRef<boolean>(false);
    const answerAppliedRef = useRef<boolean>(false);
    const iceSeenRef = useRef<Set<string>>(new Set());

    // polling timers
    const pollOfferTimer = useRef<number | null>(null);
    const pollAnswerTimer = useRef<number | null>(null);
    const pollIceTimer = useRef<number | null>(null);

    // -------------------- helpers --------------------
    function clearTimers() {
        if (pollOfferTimer.current) { window.clearInterval(pollOfferTimer.current); pollOfferTimer.current = null; }
        if (pollAnswerTimer.current) { window.clearInterval(pollAnswerTimer.current); pollAnswerTimer.current = null; }
        if (pollIceTimer.current) { window.clearInterval(pollIceTimer.current); pollIceTimer.current = null; }
    }

    function destroyPeer() {
        try { peerRef.current?.destroy(); } catch { }
        peerRef.current = null;
        offerAppliedRef.current = false;
        answerAppliedRef.current = false;
        iceSeenRef.current.clear();
    }

    function stopMedia() {
        try {
            streamRef.current?.getTracks().forEach(t => t.stop());
        } catch { }
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
    }

    // -------------------- start / connect --------------------
    async function start() {
        try {
            if (!roomId) {
                // автогенерація кімнати для зручності
                setRoomId(crypto.randomUUID());
            }
            setStatus('connecting');
            setErr(null);

            // створюємо peer
            const peer = new Peer({
                initiator: isHost,
                trickle: true, // даємо ICE йти потоком
            });
            peerRef.current = peer;

            // медіа: лише host запитує камеру та віддає треки
            if (isHost) {
                try {
                    const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    streamRef.current = media;
                    if (localVideoRef.current) localVideoRef.current.srcObject = media;
                    media.getTracks().forEach(t => peer.addTrack(t, media));
                } catch (e: any) {
                    console.error('getUserMedia error', e);
                    setErr(e?.message || 'getUserMedia failed');
                    setStatus('error');
                    return;
                }
            } else {
                // viewer слухає remote stream
                peer.on('track', (_track, remoteStream) => {
                    const el = remoteVideoRef.current;
                    if (!el) return;
                    el.srcObject = remoteStream;
                    el.play().catch(() => { });
                });
            }

            // події peer
            peer.on('connect', () => {
                console.log('[peer] connected');
                setStatus('connected');
            });
            peer.on('error', (e) => {
                console.error('[peer] error', e);
                setErr(e.message || 'peer error');
                setStatus('error');
            });
            peer.on('close', () => {
                console.log('[peer] close');
                setStatus('idle');
            });

            // signal → POST до нашого API
            peer.on('signal', async (data: SignalData) => {
                try {
                    // ОФФЕР створює тільки host
                    if ((data as any).type === 'offer') {
                        const payload: OfferPayload = { type: 'offer', sdp: data };
                        const res = await fetch('/api/webrtc/offer', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ roomId, offer: payload, from: clientIdRef.current }),
                            cache: 'no-store',
                        });
                        if (!res.ok) throw new Error('offer save failed');
                        console.log('[signal] offer saved');
                    }
                    // АНСЕР створює тільки viewer
                    else if ((data as any).type === 'answer') {
                        const payload: AnswerPayload = { type: 'answer', sdp: data };
                        const res = await fetch('/api/webrtc/answer', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ roomId, answer: payload, from: clientIdRef.current }),
                            cache: 'no-store',
                        });
                        if (!res.ok) throw new Error('answer save failed');
                        console.log('[signal] answer saved');
                    }
                    // ICE
                    else if ((data as any).candidate) {
                        const candInit = (data as any).candidate as RTCIceCandidateInit;
                        const key = `${candInit.sdpMid || ''}|${candInit.sdpMLineIndex || ''}|${candInit.candidate || ''}`;
                        if (iceSeenRef.current.has(key)) return;
                        iceSeenRef.current.add(key);

                        const payload: IcePayload = { type: 'candidate', candidate: candInit };
                        const res = await fetch('/api/webrtc/candidate', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ roomId, ice: payload, from: clientIdRef.current }),
                            cache: 'no-store',
                        });
                        if (!res.ok) throw new Error('ice save failed');
                        // console.log('[signal] ice saved');
                    }
                } catch (e: any) {
                    console.error('[signal POST] error', e);
                    setErr(e.message || 'signal post error');
                }
            });

            // -------------------- polling --------------------
            clearTimers();

            // viewer → чекає offer
            if (!isHost) {
                const pollOffer = async () => {
                    try {
                        if (offerAppliedRef.current) return; // вже застосували
                        const r = await fetch(`/api/webrtc/offer?roomId=${encodeURIComponent(roomId)}`, { cache: 'no-store' });
                        if (!r.ok) return;
                        const doc = await r.json();
                        if (doc?.offer?.sdp) {
                            const sig = asSignal(doc.offer.sdp);
                            if (sig?.type === 'offer' && !offerAppliedRef.current) {
                                console.log('[viewer] applying offer…');
                                peer.signal(sig); // <— ВАЖЛИВО: один раз
                                offerAppliedRef.current = true;
                            }
                        }
                    } catch { }
                };
                pollOffer();
                pollOfferTimer.current = window.setInterval(pollOffer, 1200) as unknown as number;
            }

            // host → чекає answer
            if (isHost) {
                const pollAnswer = async () => {
                    try {
                        if (answerAppliedRef.current) return;
                        const r = await fetch(`/api/webrtc/answer?roomId=${encodeURIComponent(roomId)}&to=${encodeURIComponent(clientIdRef.current)}`, { cache: 'no-store' });
                        if (!r.ok) return;
                        const doc = await r.json();
                        if (doc?.answer?.sdp) {
                            const sig = asSignal(doc.answer.sdp);
                            if (sig?.type === 'answer' && !answerAppliedRef.current) {
                                console.log('[host] applying answer…');
                                peer.signal(sig); // <— ВАЖЛИВО: один раз
                                answerAppliedRef.current = true;
                            }
                        }
                    } catch { }
                };
                pollAnswer();
                pollAnswerTimer.current = window.setInterval(pollAnswer, 1200) as unknown as number;
            }

            // обидва отримують ICE від контрагента
            const pollIce = async () => {
                try {
                    const r = await fetch(`/api/webrtc/candidate?roomId=${encodeURIComponent(roomId)}&to=${encodeURIComponent(clientIdRef.current)}`, { cache: 'no-store' });
                    if (!r.ok) return;
                    const list = await r.json();
                    if (!Array.isArray(list)) return;
                    for (const it of list) {
                        if (!it?.ice?.candidate) continue;
                        const c: RTCIceCandidateInit = it.ice.candidate;

                        // дедуп по ключу
                        const key = `${c.sdpMid || ''}|${c.sdpMLineIndex || ''}|${c.candidate || ''}`;
                        if (iceSeenRef.current.has(key)) continue;
                        iceSeenRef.current.add(key);

                        // ⬇️ ГОЛОВНЕ ВИПРАВЛЕННЯ: конвертуємо Init → реальний RTCIceCandidate
                        const rtc = new RTCIceCandidate(c);
                        const sig = { type: 'candidate', candidate: rtc } as unknown as SignalData;
                        peer.signal(sig);
                    }
                } catch { }
            };
            pollIce();
            pollIceTimer.current = window.setInterval(pollIce, 1000) as unknown as number;

        } catch (e: any) {
            console.error('start error', e);
            setErr(e.message || 'start error');
            setStatus('error');
        }
    }

    function disconnect() {
        resetAll();
    }

    // -------------------- capture to Mongo --------------------
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
                    roomId,
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

    // -------------------- effects --------------------
    useEffect(() => {
        clientIdRef.current = getClientId();
    }, []);

    // при зміні roomId/mode — чистимо старе
    useEffect(() => {
        return () => {
            resetAll();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, roomId]);

    // -------------------- UI --------------------
    const subtitle = useMemo(() => isHost ? 'host' : 'viewer', [isHost]);

    return (
        <div className="rounded-2xl bg-white/80 p-4 shadow-soft text-slate-900">
            <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded bg-slate-100 text-xs">{subtitle}</span>
                <span className={`px-2 py-1 rounded text-xs ${status === 'connected' ? 'bg-emerald-100 text-emerald-700' : status === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                    status: {status}
                </span>
                {err && <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 text-xs">ERR: {err}</span>}
                <div className="ml-auto flex gap-2">
                    <button
                        className="px-3 py-1 rounded bg-slate-900 text-white text-sm"
                        onClick={() => setMode(m => (m === 'host' ? 'viewer' : 'host'))}
                    >
                        Режим: {isHost ? 'Хост' : 'Глядач'}
                    </button>
                    <button
                        className="px-3 py-1 rounded bg-indigo-600 text-white text-sm"
                        onClick={start}
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
                    className="ml-auto px-3 py-1 rounded bg-amber-500 text-white text-sm"
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
