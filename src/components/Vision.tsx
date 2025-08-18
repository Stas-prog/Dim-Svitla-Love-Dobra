'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Peer, { Instance, SignalData } from 'simple-peer';
import { getClientId } from '@/lib/clientId';

type Props = {
    roomId?: string;
    initialMode?: 'host' | 'viewer';
};

type IcePayload = { type: 'candidate'; candidate: RTCIceCandidateInit };
type OfferPayload = { type: 'offer'; sdp: any };
type AnswerPayload = { type: 'answer'; sdp: any };

export default function Vision({ roomId, initialMode = 'viewer' }: Props) {
    const [mode, setMode] = useState<'host' | 'viewer'>(initialMode);
    const [status, setStatus] = useState<'idle' | 'ready' | 'connecting' | 'connected' | 'error'>('idle');
    const [err, setErr] = useState<string | null>(null);
    const [snapBusy, setSnapBusy] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const peerRef = useRef<Instance | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const clientIdRef = useRef<string>('client');

    const isHost = mode === 'host';

    // контрастні бейджі
    const Badge = ({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'emerald' | 'rose' | 'indigo' }) => {
        const map: Record<string, string> = {
            slate: 'bg-slate-100 text-slate-900',
            emerald: 'bg-emerald-100 text-emerald-900',
            rose: 'bg-rose-100 text-rose-900',
            indigo: 'bg-indigo-100 text-indigo-900',
        };
        return <span className={`px-2 py-1 rounded text-xs font-semibold ${map[tone]}`}>{children}</span>;
    };

    useEffect(() => {
        clientIdRef.current = getClientId();
        setStatus('ready');
    }, []);

    async function createPeer() {
        setErr(null);
        setStatus('connecting');

        if (peerRef.current) {
            try { peerRef.current.destroy(); } catch { }
            peerRef.current = null;
        }

        const peer = new Peer({
            initiator: isHost,
            trickle: true, // будемо надсилати ICE одразу
        });

        peerRef.current = peer;

        peer.on('signal', async (data: SignalData) => {
            try {
                if ((data as any).type === 'offer') {
                    // HOST -> зберегти offer
                    const res = await fetch('/api/webrtc/offer', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                            roomId,
                            offer: data as OfferPayload,
                            from: clientIdRef.current,
                        }),
                    });
                    if (!res.ok) throw new Error('offer save failed');
                } else if ((data as any).type === 'answer') {
                    // VIEWER -> зберегти answer
                    const res = await fetch('/api/webrtc/answer', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                            roomId,
                            answer: data as AnswerPayload,
                            from: clientIdRef.current,
                        }),
                    });
                    if (!res.ok) throw new Error('answer save failed');
                } else if ((data as any).candidate) {
                    // ICE
                    const payload: IcePayload = { type: 'candidate', candidate: (data as any).candidate };
                    const res = await fetch('/api/webrtc/candidate', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                            roomId,
                            ice: payload,
                            from: clientIdRef.current,
                        }),
                    });
                    if (!res.ok) throw new Error('ice save failed');
                }
            } catch (e: any) {
                console.error('signal POST error', e);
                setErr(e.message || 'signal error');
            }
        });

        peer.on('connect', () => setStatus('connected'));
        peer.on('error', (e) => { setErr(e.message); setStatus('error'); });
        peer.on('close', () => setStatus('idle'));

        // медіа
        if (isHost) {
            try {
                const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                streamRef.current = media;
                localVideoRef.current && (localVideoRef.current.srcObject = media);
                media.getTracks().forEach((t) => peer.addTrack(t, media));
            } catch (e: any) {
                setErr(e.message || 'getUserMedia failed');
            }
        } else {
            // viewer слухає remote track
            peer.on('track', (track, stream) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                }
            });
        }

        // Пулл сигналів із БД
        pollSignals(peer).catch(console.error);
    }

    async function pollSignals(peer: Instance) {
        // простий луп: host чекає answer/ice, viewer — offer/ice
        // (ми можемо робити це інтервально, тут — швидкий цикл з паузою)
        let stop = false;
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        while (!stop && peerRef.current === peer) {
            try {
                if (isHost) {
                    // хост читає answer + ice від глядача
                    const r = await fetch(`/api/webrtc/answer?roomId=${roomId}&to=${clientIdRef.current}`, { cache: 'no-store' });
                    if (r.ok) {
                        const { answer, ice }: { answer?: AnswerPayload; ice?: IcePayload[] } = await r.json();
                        if (answer) peer.signal(answer as SignalData);
                        if (ice?.length) ice.forEach((i) => peer.signal(i as SignalData));
                    }
                } else {
                    // viewer читає offer + ice від хоста
                    const r = await fetch(`/api/webrtc/offer?roomId=${roomId}&to=${clientIdRef.current}`, { cache: 'no-store' });
                    if (r.ok) {
                        const { offer, ice }: { offer?: OfferPayload; ice?: IcePayload[] } = await r.json();
                        if (offer) peer.signal(offer as SignalData);
                        if (ice?.length) ice.forEach((i) => peer.signal(i as SignalData));
                    }
                }
            } catch (e) {
                // ignore single errors
            }
            await sleep(1200);
            // вийдемо з циклу якщо компонент розмонтувався / peer знищено
            if (!peerRef.current || peerRef.current !== peer) stop = true;
        }
    }

    function destroyPeer() {
        try { peerRef.current?.destroy(); } catch { }
        peerRef.current = null;
        setStatus('idle');
    }

    async function takeSnapshotToMongo() {
        if (!isHost) return; // знімок робить хост зі свого потоку
        const video = localVideoRef.current;
        if (!video) return;

        const canvas = document.createElement('canvas');
        const W = (video.videoWidth || 640);
        const H = (video.videoHeight || 360);
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setSnapBusy(true);
        try {
            ctx.drawImage(video, 0, 0, W, H);
            const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', 0.9));
            const b64 = await blobToBase64(blob);

            const r = await fetch('/api/vision/snap', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    roomId,
                    dataUrl: b64,
                    createdAt: new Date().toISOString(),
                }),
            });
            if (!r.ok) throw new Error('snap save failed');
        } catch (e: any) {
            setErr(e.message || 'snapshot failed');
        } finally {
            setSnapBusy(false);
        }
    }

    function blobToBase64(b: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(String(fr.result));
            fr.onerror = reject;
            fr.readAsDataURL(b);
        });
    }

    // при зміні режиму — повний reset peer
    useEffect(() => () => destroyPeer(), []);

    return (
        <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge tone="indigo">room: {roomId}</Badge>
                <Badge tone={isHost ? 'emerald' : 'slate'}>{isHost ? 'host' : 'viewer'}</Badge>
                <Badge tone={status === 'connected' ? 'emerald' : status === 'connecting' ? 'indigo' : 'slate'}>status: {status}</Badge>
                {err && <Badge tone="rose">ERR: {err}</Badge>}

                <div className="ml-auto flex gap-2">
                    <button
                        onClick={() => setMode('host')}
                        className={`px-3 py-1 rounded font-semibold ${isHost ? 'bg-emerald-600' : 'bg-slate-700'} hover:opacity-90`}
                    >
                        Host
                    </button>
                    <button
                        onClick={() => setMode('viewer')}
                        className={`px-3 py-1 rounded font-semibold ${!isHost ? 'bg-indigo-600' : 'bg-slate-700'} hover:opacity-90`}
                    >
                        Viewer
                    </button>
                </div>
            </div>

            {/* керування */}
            <div className="flex flex-wrap gap-2 mb-4">
                {status !== 'connected' ? (
                    <button
                        onClick={createPeer}
                        className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 font-semibold"
                    >
                        🔗 Підключити
                    </button>
                ) : (
                    <button
                        onClick={destroyPeer}
                        className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 active:bg-rose-700 font-semibold"
                    >
                        ✂️ Роз’єднати
                    </button>
                )}

                {/* Знімок у Mongo — тільки в кімнаті та тільки для host */}
                <button
                    onClick={takeSnapshotToMongo}
                    disabled={!isHost || status !== 'connected' || snapBusy}
                    className="px-4 py-2 rounded bg-yellow-500/90 hover:bg-yellow-400 active:bg-yellow-600 font-semibold disabled:opacity-50"
                    title={isHost ? '' : 'Знімок може робити тільки Host'}
                >
                    📸 Зробити фото в Mongo
                </button>
            </div>

            {/* відео-блоки */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded bg-black/60 border border-white/10 p-2">
                    <div className="text-sm mb-1 text-slate-300">Local</div>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 bg-black rounded"
                    />
                </div>
                <div className="rounded bg-black/60 border border-white/10 p-2">
                    <div className="text-sm mb-1 text-slate-300">Remote</div>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 bg-black rounded"
                    />
                </div>
            </div>
        </div>
    );
}
