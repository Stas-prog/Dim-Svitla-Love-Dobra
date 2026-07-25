"use client";

import { motion } from "framer-motion";

type Props = {
  dict: {
    home: {
      unity: {
        title: string;
      };
    };
  };
};

export default function Unity({ dict }: Props) {
  return (
    <div className="flex justify-center items-center w-full">
      <motion.svg
        viewBox="0 0 220 220"
        className="
          w-56
          h-56
          sm:w-64
          sm:h-64
          md:w-72
          md:h-72
          drop-shadow-[0_0_55px_rgba(255,190,120,0.35)]
        "
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          scale: [1, 1.03, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <defs>
          <radialGradient id="unityGradient">
            <stop offset="0%" stopColor="#FFD580" />
            <stop offset="100%" stopColor="#FF6B6B" />
          </radialGradient>
        </defs>

        <circle
          cx="110"
          cy="110"
          r="90"
          fill="url(#unityGradient)"
        />

        <text
          x="110"
          y="116"
          textAnchor="middle"
          fill="white"
          fontSize="18"
          fontWeight="700"
        >
          {dict.home.unity.title}
        </text>
      </motion.svg>
    </div>
  );
}