"use client";

import type { TransactionRow } from "@/lib/transactions";

type Props = {
  items: TransactionRow[];
  onDelete?: (id: string) => void;
  onEdit?: (row: TransactionRow) => void;
};

export default function TxList({ items, onDelete, onEdit }: Props) {
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

            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold whitespace-nowrap">
                {tx.amount.toLocaleString()}円
              </p>

              {/* 編集（任意） */}
              <button
                type="button"
                className="rounded-md border px-2 py-1 text-xs hover:bg-zinc-50"
                onClick={() => onEdit?.(tx)}
              >
                編集
              </button>

              {/* 削除 */}
              <button
                type="button"
                className="rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                onClick={() => onDelete?.(tx.id)}
              >
                削除
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
