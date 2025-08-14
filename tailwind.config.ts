import type { Config } from "tailwindcss";

export default {
    content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            keyframes: {
                twinkle: {
                    "0%, 100%": { opacity: "0.15", transform: "scale(1)" },
                    "50%": { opacity: "0.6", transform: "scale(1.15)" },
                },
                drift: {
                    "0%": { transform: "translateY(0px)" },
                    "100%": { transform: "translateY(-12px)" },
                },
                glow: {
                    "0%, 100%": { filter: "brightness(1)" },
                    "50%": { filter: "brightness(1.15)" },
                },
            },
            animation: {
                twinkle: "twinkle 5s ease-in-out infinite",
                "twinkle-slow": "twinkle 8s ease-in-out infinite",
                drift: "drift 9s ease-in-out infinite alternate",
                glow: "glow 10s ease-in-out infinite",
            },
            boxShadow: {
                soft: "0 10px 30px -10px rgba(0,0,0,0.15)",
            },
            colors: {
                dawn: {
                    top: "#FFD6B0",     // персикове світло
                    mid: "#FFEEC6",     // м’яке золото
                    low: "#CFE7FF",     // ранкове небо
                },
            },
        },
    },
    plugins: [],
} satisfies Config;
