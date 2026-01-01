"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import type { Ym } from "@/app/kakeibo/_lib/dateTypes";
import "react-day-picker/dist/style.css";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function formatYm(d: Date): Ym {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}` as Ym;
}
function parseYm(ym: string): Date | undefined {
  // ym: "YYYY-MM"
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(ym);
  if (!m) return;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  return new Date(y, mo - 1, 1);
}

const MONTH_LABELS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

type Props = {
  value: Ym;
  onChange: (nextYm: Ym) => void;
  inputClassName?: string;
  fromYear?: number;
  toYear?: number;
};

export default function MonthPicker({
  value,
  onChange,
  inputClassName,
  fromYear = 2020,
  toYear = 2035,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => parseYm(value), [value]);

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
          {/* 年だけは DayPicker の dropdown を使う */}
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              // 年dropdownが変わったときに selected が undefined になるケースがあるので無視
              if (!d) return;
              // 年だけ更新したいので、月は現在 value の月を維持する
              const current = selected ?? new Date();
              const next = new Date(d.getFullYear(), current.getMonth(), 1);
              onChange(formatYm(next));
            }}
            captionLayout="dropdown"
            fromYear={fromYear}
            toYear={toYear}
            // カレンダー（日の表）は非表示にして、下の月グリッドを使う
            classNames={{
              months: "flex flex-col",
              month: "space-y-3",
              caption: "flex items-center justify-center gap-2",
              caption_label: "text-lg font-semibold",
              dropdowns: "flex items-center gap-2",
              dropdown:
                "rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm",
              nav: "hidden",
              table: "hidden", // ← 日付表を消す
            }}
          />

          {/* 月グリッド */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {MONTH_LABELS.map((label, i) => {
              const isActive = (selected?.getMonth() ?? 0) === i;
              return (
                <button
                  key={label}
                  type="button"
                  className={[
                    "h-11 rounded-xl border text-sm",
                    "hover:bg-zinc-50",
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-600"
                      : "border-zinc-200 bg-white text-zinc-800",
                  ].join(" ")}
                  onClick={() => {
                    const base = selected ?? new Date();
                    const next = new Date(base.getFullYear(), i, 1);
                    onChange(formatYm(next));
                    setOpen(false);
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50"
              onClick={() => {
                onChange(formatYm(new Date()));
                setOpen(false);
              }}
            >
              今月
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
