'use client';

import React, { use } from 'react';
import Vision from '@/components/Vision';
import '../vision-theme.css'; // <— додаємо (з урахуванням відносного шляху)

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ mode?: 'host' | 'viewer' }>;
};

export default function VisionLinkedPage(p: Props) {
    const { id } = use(p.params);
    const s = use(p.searchParams);
    const initialMode = (s.mode === 'host' || s.mode === 'viewer') ? s.mode : 'viewer';

    return (
        <main className="vision-ui min-h-screen">
            <div className="max-w-5xl mx-auto p-4 sm:p-6">
                <h1 className="text-2xl font-bold mb-3">🔗 Vision (room: {id})</h1>
                <Vision initialRoomId={id} initialMode={initialMode} />
            </div>
        </main>
    );
}
