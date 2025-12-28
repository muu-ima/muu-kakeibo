import React from "react";

export default function Section({
  title,
  children,
  variant = "default",
  headerRight,
}: {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "ring" | "muted";
  headerRight?: React.ReactNode;
}) {
  const base = "rounded-2xl bg-white p-5 shadow-sm";
  const ring = "ring-1 ring-zinc-200";
  const muted = "bg-zinc-50";

  const className =
    variant === "ring"
      ? [base, ring].join(" ")
      : variant === "muted"
      ? [base, ring, muted].join(" ")
      : base;

  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold truncate">{title}</p>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>

      <div className="mt-3">{children}</div>
    </section>
  );
}
