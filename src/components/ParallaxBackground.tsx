"use client";

import { ParallaxLayer } from "@/lib/parallax";

/** Напівпрозорий шар, що ледь рухається і підсилює «повітря» */
export default function ParallaxBackground() {
    return (
        <ParallaxLayer depth={0.25}>
            <div className="absolute inset-0 pointer-events-none" />
        </ParallaxLayer>
    );
}
