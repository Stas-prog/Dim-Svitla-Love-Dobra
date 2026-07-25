"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  children: React.ReactNode;
  backdropOpacity?: string; // "bg-black/70" тощо
};

export default function PortalModal({ open, children, backdropOpacity="bg-gray-800" }: Props) {
  useEffect(() => {
    if (!open) return;
    // lock scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[1000] ${backdropOpacity} grid place-items-center px-3 sm:px-4`}>
      <div className="relative z-[1001] max-w-2xl w-full rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}
