"use client";

import { motion } from "framer-motion";
import ManifestLines from "./ManifestLines";
import { getMessages } from "@/lib/i18n";

type Props = {
  locale: string;
};

export default function ManifestPage({ locale }: Props) {
  const t = getMessages(locale);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-slate-900 to-emerald-900 text-white font-serif p-6 overflow-hidden">

      <div className="max-w-2xl text-center space-y-3">

        <ManifestLines locale={locale} />

        <motion.h1
          className="mt-10 text-3xl md:text-4xl font-bold text-emerald-300"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 10,
            duration: 1,
          }}
        >
          {t.manifest.title}
        </motion.h1>

      </div>

    </div>
  );
}