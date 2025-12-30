"use client";

import React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium " +
  "transition active:translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none " +
  "focus:outline-none focus:ring-4";

const variants: Record<Variant, string> = {
  primary:
    "bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.25)] " +
    "hover:bg-blue-700 focus:ring-blue-400/30",
  secondary:
    "border border-zinc-200 bg-white text-zinc-900 shadow-sm " +
    "hover:bg-zinc-50 focus:ring-zinc-300/30",
  danger:
    "border border-red-200 bg-white text-red-600 " +
    "hover:bg-red-50 focus:ring-red-300/30",
  ghost: "text-blue-600 hover:bg-blue-50 focus:ring-blue-300/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

export default function Button({
  variant = "secondary",
  size = "md",
  full,
  className,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={[
        base,
        variants[variant],
        sizes[size],
        full ? "w-full" : "",
        className ?? "",
      ].join(" ")}
    />
  );
}
