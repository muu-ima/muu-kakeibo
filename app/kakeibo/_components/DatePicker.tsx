// app/kakeibo/_components/DatePicker.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYmd(ymd: string): Date | undefined {
  // ymd: "YYYY-MM-DD"
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const dt = new Date(y, mo - 1, da);
  // 無効日付対策
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== da)
    return;
  return dt;
}

type Props = {
  value: string; // "YYYY-MM-DD"
  onChange: (nextYmd: string) => void;
  inputClassName?: string;
};

export default function DatePicker({ value, onChange, inputClassName }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => parseYmd(value), [value]);

  // click outside to close
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      {/* Input row */}
      <button
        type="button"
        className={[
          "w-full text-left",
          "h-12 rounded-lg border border-zinc-200 bg-white px-3 text-base",
          "flex items-center justify-between gap-2",
          "hover:bg-zinc-50",
          inputClassName ?? "",
        ].join(" ")}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="tabular-nums">{value}</span>
        <span className="text-zinc-400">📅</span>
      </button>

      {/* Popover */}
      {open && (
        <div
          className={[
            "absolute z-50 mt-2 w-90 max-w-[92vw]",
            "rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl",
          ].join(" ")}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (!d) return;
              onChange(formatYmd(d));
              setOpen(false);
            }}
            weekStartsOn={1}
            captionLayout="dropdown"
            fromYear={2020}
            toYear={2035}
            classNames={{
              months: "flex flex-col",
              month: "space-y-3",
              caption: "flex items-center justify-center gap-2",
              caption_label: "text-lg font-semibold",
              dropdowns: "flex items-center gap-2",
              dropdown:
                "rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm",
              nav: "hidden", // dropdownで十分なら非表示。矢印欲しければ消してOK
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell:
                "w-12 text-center text-xs font-medium text-zinc-500",
              row: "flex w-full",
              cell: "w-12 h-12 p-0 text-center",
              day: [
                "w-12 h-12 rounded-xl text-base",
                "hover:bg-zinc-100",
                "focus:outline-none focus:ring-2 focus:ring-blue-400/40",
              ].join(" "),
              day_selected:
                "bg-blue-600 text-white hover:bg-blue-600 focus:bg-blue-600",
              day_today: "border border-blue-500",
              day_outside: "text-zinc-300",
            }}
          />

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50"
              onClick={() => {
                onChange(formatYmd(new Date()));
                setOpen(false);
              }}
            >
              今日
            </button>

            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50"
              onClick={() => setOpen(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
