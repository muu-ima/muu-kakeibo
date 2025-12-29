"use client";

import { useEffect } from "react";

export default function Toast({
  open,
  message,
  onClose,
  ms = 1800,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
  ms?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(onClose, ms);
    return () => clearTimeout(id);
  }, [open, ms, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-60 flex justify-center px-4">
      <div
        role="status"
        className="
          pointer-events-none
          rounded-full bg-zinc-900/90 px-4 py-2
          text-sm text-white shadow-lg backdrop-blur
          animate-[toastIn_.18s_ease-out]
        "
      >
        {message}
      </div>

      {/* keyframes (Tailwindに無いので globals.css で定義) */}
    </div>
  );
}
