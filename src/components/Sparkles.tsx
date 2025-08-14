"use client";

import { useMemo } from "react";

type Dot = { left: string; top: string; size: number; dur: number; delay: number; blur: number };

export default function Sparkles({ count = 28 }: { count?: number }) {
    const dots = useMemo<Dot[]>(() => {
        const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
        return Array.from({ length: count }).map(() => ({
            left: `${rnd(3, 97)}%`,
            top: `${rnd(5, 85)}%`,
            size: rnd(2, 4),
            dur: rnd(5, 10),
            delay: rnd(0, 6),
            blur: rnd(0, 2.5),
        }));
    }, [count]);

    return (
        <div aria-hidden className="pointer-events-none absolute inset-0">
            {dots.map((d, i) => (
                <div
                    key={i}
                    className="absolute rounded-full bg-white/90 animate-twinkle"
                    style={{
                        left: d.left,
                        top: d.top,
                        width: d.size,
                        height: d.size,
                        filter: `blur(${d.blur}px)`,
                        animationDuration: `${d.dur}s`,
                        animationDelay: `${d.delay}s`,
                    }}
                />
            ))}
        </div>
    );
}
