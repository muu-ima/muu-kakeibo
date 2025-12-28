// app/kakeibo/layout.tsx
import React from "react";

export default function KakeiboLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-3xl p-6">{children}</div>
    </div>
  );
}
