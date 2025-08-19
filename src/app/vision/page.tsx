'use client';

import React from 'react';
import Vision from '@/components/Vision';
import './vision-theme.css'; // <— додаємо

export default function VisionPage() {
    return (
        <main className="vision-ui min-h-screen">
            <div className="max-w-5xl mx-auto p-4 sm:p-6">
                <h1 className="text-2xl font-bold mb-3">👁️ Vision</h1>
                {/* базовий режим – вибір у UI */}
                <Vision />
            </div>
        </main>
    );
}
