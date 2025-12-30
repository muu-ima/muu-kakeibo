// app/kakeibo/layout.tsx
import React from "react";

export default function KakeiboLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-2 sm:px-4 py-4 sm:py-6">{children}</div>
    </div>
  );
}
