import type { TransactionRow } from "@/lib/transactions";

export default function TxList({ items }: { items: TransactionRow[] }) {
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

            <p className="text-sm font-semibold whitespace-nowrap">
              {tx.amount.toLocaleString()}円
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
