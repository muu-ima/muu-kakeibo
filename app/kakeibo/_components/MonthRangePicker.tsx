"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Ym } from "@/app/kakeibo/_lib/dateTypes";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function ym(y: number, m: number): Ym {
  return `${y}-${pad2(m)}` as Ym;
}
function toKey(v: Ym) {
  return v; // "YYYY-MM"
}
function parseYm(v: string): { y: number; m: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(v);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]) };
}

function cmp(a: Ym, b: Ym) {
  return toKey(a).localeCompare(toKey(b));
}
function clampRange(from: Ym, to: Ym): { from: Ym; to: Ym } {
  return cmp(from, to) <= 0 ? { from, to } : { from: to, to: from };
}

type Props = {
  from: Ym;
  to: Ym;
  onChange: (next: { from: Ym; to: Ym }) => void;
};

export default function MonthRangePicker({ from, to, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const p = parseYm(to) ?? { y: new Date().getFullYear(), m: 1 };
    return p.y;
  });

  const draftFromRef = useRef<Ym | null>(null);


  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        draftFromRef.current = null; // ← これを追加
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const label = useMemo(() => `${from} 〜 ${to}`, [from, to]);

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        label: `${i + 1}月`,
        value: ym(viewYear, i + 1),
      })),
    [viewYear]
  );

  const range = useMemo(() => clampRange(from, to), [from, to]);
  const isInRange = (v: Ym) => cmp(range.from, v) <= 0 && cmp(v, range.to) <= 0;

  const pick = (v: Ym) => {
    const draftFrom = draftFromRef.current;

    if (!draftFrom) {
      draftFromRef.current = v;
      onChange({ from: v, to: v }); // プレビュー
      return;
    }

    const next = clampRange(draftFrom, v);
    onChange(next);
    draftFromRef.current = null;
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        className={[
          "w-full h-12 rounded-lg border border-zinc-200 bg-white px-3",
          "flex items-center justify-between",
          "hover:bg-zinc-50",
        ].join(" ")}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="tabular-nums">{label}</span>
        <span className="text-zinc-400">🗓️</span>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-90 max-w-[92vw] rounded-2xl border bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="rounded-lg border px-2 py-1 text-sm hover:bg-zinc-50"
              onClick={() => setViewYear((y) => y - 1)}
            >
              ←
            </button>
            <div className="text-base font-semibold">{viewYear}年</div>
            <button
              type="button"
              className="rounded-lg border px-2 py-1 text-sm hover:bg-zinc-50"
              onClick={() => setViewYear((y) => y + 1)}
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {months.map((m) => {
              const active = isInRange(m.value);
              const edge = m.value === range.from || m.value === range.to;

              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => pick(m.value)}
                  className={[
                    "h-12 rounded-xl border text-sm font-medium",
                    active ? "bg-blue-600/10 border-blue-200" : "bg-white",
                    edge ? "ring-2 ring-blue-400/40" : "",
                    "hover:bg-zinc-50",
                  ].join(" ")}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50"
              onClick={() => {
                const now = new Date();
                const v = ym(now.getFullYear(), now.getMonth() + 1);
                draftFromRef.current = null;
                onChange({ from: v, to: v });
                setViewYear(now.getFullYear());
                setOpen(false);
              }}
            >
              今月
            </button>

            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50"
              onClick={() => {
                draftFromRef.current = null;
                setOpen(false);
              }}
            >
              閉じる
            </button>
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            ※月をクリックして範囲を選択（もう一度クリックで確定）
          </p>
        </div>
      )}
    </div>
  );
}
