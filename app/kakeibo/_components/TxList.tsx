"use client";

import { useState } from "react";
import type { TransactionRow } from "@/lib/transactions";

type Props = {
  items: TransactionRow[];
  onDelete?: (id: string) => void;
  onEdit?: (row: TransactionRow) => void;
  readOnly?: boolean;
};

export default function TxList({ items, onDelete, onEdit, readOnly }: Props) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">データなし</p>;
  }

  return (
    <ul className="divide-y divide-zinc-100">
      {items.map((tx) => (
        <li key={tx.id} className="py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {tx.date} / {tx.category}
                <span className="ml-1 text-xs text-zinc-500">
                  ({tx.type === "expense" ? "支出" : "収入"})
                </span>
              </p>
              {tx.memo && <p className="text-xs text-zinc-500">{tx.memo}</p>}
            </div>

            <div className="flex items-center gap-2 relative">
              <p className="text-sm font-semibold whitespace-nowrap">
                {tx.amount.toLocaleString()}円
              </p>

              {/* ===== PC用（md以上） ===== */}
              {!readOnly && (
                <div className="hidden md:flex items-center gap-2">
                  {onEdit && (
                    <button
                      type="button"
                      className="rounded-md border px-2 py-1 text-xs"
                      onClick={() => onEdit(tx)}
                    >
                      編集
                    </button>
                  )}

                  <button
                    type="button"
                    className="rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => onDelete?.(tx.id)}
                  >
                    削除
                  </button>
                </div>
              )}
              {/* ===== モバイル用（三点） ===== */}
               {!readOnly && (
              <div className="md:hidden relative">
                <button
                  type="button"
                  className="rounded-md border px-2 py-1 text-sm"
                  onClick={() =>
                    setOpenMenuId(openMenuId === tx.id ? null : tx.id)
                  }
                >
                  ⋯
                </button>

                {openMenuId === tx.id && (
                  <div className="absolute right-0 top-8 z-10 w-28 overflow-hidden rounded-lg border bg-white shadow-lg">
                    <button
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50"
                      onClick={() => {
                        setOpenMenuId(null);
                        onEdit?.(tx);
                      }}
                    >
                      編集
                    </button>
                    <button
                      className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setOpenMenuId(null);
                        onDelete?.(tx.id);
                      }}
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>
               )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
