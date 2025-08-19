'use client';

import React, { useEffect, useRef, useState } from 'react';
import SimplePeer, { SignalData } from 'simple-peer';
import { getClientId } from '@/lib/clientId';

type Mode = 'host' | 'viewer';

type OfferPayload = { type: 'offer'; sdp: any };
type AnswerPayload = { type: 'answer'; sdp: any };
type IcePayload = { type: 'candidate'; candidate: RTCIceCandidateInit };

type OfferDoc = {
    roomId: string;
    from: string; // host id
    sdp: any;
    createdAt: string;
};

type AnswerDoc = {
    roomId: string;
    from: string; // viewer id
    to?: string;  // host id (обов’язково тепер проставляємо)
    sdp: any;
    createdAt: string;
};

type IceDoc = {
    roomId: string;
    from: string;
    to?: string;
    payload: IcePayload;
    createdAt: string;
};

export default function Vision({
    initialMode,
    initialRoomId,
}: {
    initialMode?: Mode;
    initialRoomId?: string;
}) {
    const [mode, setMode] = useState<Mode>(initialMode ?? 'viewer');
    const [roomId, setRoomId] = useState<string>(initialRoomId ?? '');
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [err, setErr] = useState<string | null>(null);

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const peerRef = useRef<SimplePeer.Instance | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const destroyedRef = useRef(false);

    const clientIdRef = useRef<string>('');         // мій id
    const otherSideIdRef = useRef<string | null>(null); // hostId для viewer, viewerId для host

    // гарантійно зупинити peer
    const destroyPeer = () => {
        try { peerRef.current?.destroy(); } catch { }
        peerRef.current = null;
        destroyedRef.current = true;
        setStatus('idle');
    };

    useEffect(() => {
        clientIdRef.current = getClientId();
        return () => destroyPeer();
    }, []);

    async function start() {
        setErr(null);
        if (!roomId) {
            setErr('Вкажи roomId');
            return;
        }
        destroyedRef.current = false;

        const isHost = mode === 'host';
        setStatus('connecting');

        const peer = new SimplePeer({
            initiator: isHost,
            trickle: true,
            config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
        });
        peerRef.current = peer;

        // MEDIA / STREAM WIRING
        if (isHost) {
            try {
                const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                streamRef.current = media;
                if (localVideoRef.current) localVideoRef.current.srcObject = media;
                media.getTracks().forEach(t => peer.addTrack(t, media));
            } catch (e: any) {
                setErr(e.message || 'getUserMedia failed');
            }
        } else {
            peer.on('stream', (remote: MediaStream) => {
                const el = remoteVideoRef.current;
                if (el) {
                    el.srcObject = remote;
                    el.play().catch(() => { });
                }
            });
        }

        // SIGNAL OUT
        peer.on('signal', async (data: SignalData) => {
            try {
                // OFFER (від host)
                if ((data as any).type === 'offer') {
                    const res = await fetch('/api/webrtc/offer', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                            roomId,
                            offer: data as OfferPayload,
                            from: clientIdRef.current, // host id
                        }),
                    });
                    if (!res.ok) throw new Error('offer save failed');
                }
                // ANSWER (від viewer)
                else if ((data as any).type === 'answer') {
                    // маємо знати hostId
                    if (!otherSideIdRef.current) {
                        throw new Error('hostId (to) is undefined for answer');
                    }
                    const res = await fetch('/api/webrtc/answer', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                            roomId,
                            answer: data as AnswerPayload,
                            from: clientIdRef.current,      // viewer id
                            to: otherSideIdRef.current,     // host id
                        }),
                    });
                    if (!res.ok) throw new Error('answer save failed');
                }
                // ICE
                else if ((data as any).candidate) {
                    const payload: IcePayload = { type: 'candidate', candidate: (data as any).candidate };
                    const res = await fetch('/api/webrtc/candidate', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                            roomId,
                            ice: payload,
                            from: clientIdRef.current,
                            to: otherSideIdRef.current ?? undefined,
                        }),
                    });
                    if (!res.ok) throw new Error('ice save failed');
                }
            } catch (e: any) {
                console.error('signal POST error', e);
                setErr(e.message || 'signal error');
            }
        });

        // SIGNAL IN (polling)
        const poll = async () => {
            if (destroyedRef.current) return;
            try {
                if (isHost) {
                    // HOST:
                    // 1) answer для hostId
                    const rA = await fetch(`/api/webrtc/answer?roomId=${roomId}&to=${clientIdRef.current}`, { cache: 'no-store' });
                    const ans: AnswerDoc | {} = await rA.json();
                    if ((ans as any).sdp) {
                        if (peerRef.current && !peerRef.current.destroyed) {
                            peerRef.current.signal({ type: 'answer', sdp: (ans as any).sdp } as any);
                            // otherSideId: хто дав answer — це viewer
                            otherSideIdRef.current = (ans as any).from || otherSideIdRef.current;
                        }
                    }
                    // 2) ICE для hostId
                    const rI = await fetch(`/api/webrtc/candidate?roomId=${roomId}&to=${clientIdRef.current}`, { cache: 'no-store' });
                    const ices: IceDoc[] | [] = await rI.json();
                    if (Array.isArray(ices) && ices.length && peerRef.current && !peerRef.current.destroyed) {
                        ices.forEach(it => {
                            peerRef.current!.signal({ type: 'candidate', candidate: it.payload.candidate } as any);
                            // збережемо viewerId
                            otherSideIdRef.current = it.from || otherSideIdRef.current;
                        });
                    }
                } else {
                    // VIEWER:
                    // 1) offer тягнемо, беремо hostId
                    const rO = await fetch(`/api/webrtc/offer?roomId=${roomId}`, { cache: 'no-store' });
                    const off: OfferDoc | {} = await rO.json();
                    if ((off as any).sdp) {
                        const hostId = (off as any).from as string | undefined;
                        if (hostId) otherSideIdRef.current = hostId; // <-- критично!
                        if (peerRef.current && !peerRef.current.destroyed) {
                            peerRef.current.signal({ type: 'offer', sdp: (off as any).sdp } as any);
                        }
                    }
                    // 2) ICE для viewerId
                    const rI = await fetch(`/api/webrtc/candidate?roomId=${roomId}&to=${clientIdRef.current}`, { cache: 'no-store' });
                    const ices: IceDoc[] | [] = await rI.json();
                    if (Array.isArray(ices) && ices.length && peerRef.current && !peerRef.current.destroyed) {
                        ices.forEach(it => {
                            peerRef.current!.signal({ type: 'candidate', candidate: it.payload.candidate } as any);
                            // на випадок — збережемо hostId, якщо прилетіло
                            otherSideIdRef.current = it.from || otherSideIdRef.current;
                        });
                    }
                }
            } catch (e) {
                // тихо
            } finally {
                setTimeout(poll, 1500);
            }
        };
        poll();

        peer.on('connect', () => setStatus('connected'));
        peer.on('error', (e) => { setErr(e.message); setStatus('error'); });
        peer.on('close', () => setStatus('idle'));
    }

    function stop() {
        destroyPeer();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }

    return (
        <div className="space-y-3">
            <div className="card p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="badge">status: {status}</span>
                    {err && <span className="badge" style={{ background: 'rgba(239,68,68,0.25)' }}>ERR: {err}</span>}

                    <select
                        className="ml-auto"
                        value={mode}
                        onChange={(e) => setMode(e.target.value as Mode)}
                    >
                        <option value="host">host</option>
                        <option value="viewer">viewer</option>
                    </select>

                    <input
                        placeholder="roomId"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="min-w-[220px]"
                    />

                    <button className="btn" onClick={start}>Підключити</button>
                    <button className="btn secondary" onClick={stop}>Вимкнути</button>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
                <div className="card p-2">
                    <div className="text-sm mb-2">Local (host)</div>
                    <video ref={localVideoRef} playsInline autoPlay muted className="w-full h-[220px] bg-black rounded" />
                </div>
                <div className="card p-2">
                    <div className="text-sm mb-2">Remote (viewer)</div>
                    <video ref={remoteVideoRef} playsInline autoPlay className="w-full h-[220px] bg-black rounded" />
                </div>
            </div>
        </div>
    );
}
