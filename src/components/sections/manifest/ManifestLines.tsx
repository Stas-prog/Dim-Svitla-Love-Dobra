"use client";

import { motion } from "framer-motion";
import { getMessages } from "@/lib/i18n";

type Props = {
  locale: string;
};

export default function ManifestLines({ locale }: Props) {
  const t = getMessages(locale);

  return (
    <>
      {t.manifest.lines.map((line, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: i * 0.6,
            duration: 0.8,
          }}
          className="text-lg md:text-xl"
        >
          {line.highlight ? (
            <motion.span
              className="font-bold"
              animate={{
                scale: [1, 1.1, 1],
                color: ["#ffffff", "#facc15", "#ffffff"],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
              }}
            >
              {line.text}
            </motion.span>
          ) : (
            line.text
          )}
        </motion.p>
      ))}
    </>
  );
}