// app/kakeibo/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase.client";
import { useRouter } from "next/navigation";
import {
  addTransaction,
  listTransactions,
  type TxType,
  type TransactionRow,
} from "@/lib/transactions";

export default function KakeiboPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState("食費");
  const [memo, setMemo] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<TransactionRow[]>([]);
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  ); // YYYY-MM

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setEmail(data.session.user.email ?? null);
    });
  }, [router]);

  useEffect(() => {
    if (!email) return;
    (async () => {
      try {
        const rows = await listTransactions(month);
        setItems(rows);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [email, month]);

  if (!email) return <main className="p-6">loading...</main>;

  const expenseTotal = items
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const incomeTotal = items
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = incomeTotal - expenseTotal;

  return (
    <main className="p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">家計簿</h1>
        <p className="text-sm text-zinc-700">ログイン中: {email}</p>

        <button
          className="rounded-lg border px-3 py-2"
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
        >
          ログアウト
        </button>
      </div>
      {/* 追加 */}
      <section className="max-w-md space-y-2 rounded-xl border p-4">
        <p className="font-medium">追加</p>

        <div className="grid grid-cols-2 gap-2">
          <input
            className="w-full rounded-lg border p-2"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <select
            className="w-full rounded-lg border p-2"
            value={type}
            onChange={(e) => setType(e.target.value as TxType)}
          >
            <option value="expense">支出</option>
            <option value="income">収入</option>
          </select>

          <input
            className="w-full rounded-lg border p-2"
            inputMode="numeric"
            placeholder="金額(円)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <input
            className="w-full rounded-lg border p-2"
            placeholder="カテゴリ"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <input
          className="w-full rounded-lg border p-2"
          placeholder="メモ（任意）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        <button
          className="w-full rounded-lg border px-3 py-2"
          onClick={async () => {
            setMsg("");
            setError(null);

            try {
              const amountNumber = Number(amount);
              if (!Number.isFinite(amountNumber)) {
                setError("金額が正しくありません");
                return;
              }

              await addTransaction({
                date,
                type,
                amount: Math.floor(amountNumber),
                category,
                memo,
              });

              // 保存後に再読込
              const rows = await listTransactions(month);
              setItems(rows);

              setAmount("");
              setMemo("");
              setMsg("保存しました");
            } catch (e: unknown) {
              const message = e instanceof Error ? e.message : "エラー";
              setMsg(message);
            }
          }}
        >
          保存
        </button>

        {msg && <p className="text-sm text-zinc-700">{msg}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      <section className="max-w-md space-y-2 rounded-xl border p-4">
        <p className="font-medium">月合計（{month}）</p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-zinc-500">収入</p>
            <p className="text-sm font-semibold">
              {incomeTotal.toLocaleString()}円
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-xs text-zinc-500">支出</p>
            <p className="text-sm font-semibold">
              {expenseTotal.toLocaleString()}円
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-xs text-zinc-500">差額</p>
            <p className="text-sm font-semibold">
              {balance.toLocaleString()}円
            </p>
          </div>
        </div>
      </section>

      {/* 一覧 */}
      <section className="max-w-md space-y-2 rounded-xl border p-4">
        <div>
          <p>一覧</p>
          <input
            type="month"
            className="rounded-lg border p-2"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">データなし</p>
        ) : (
          <ul className="space-y-2">
            {items.map((tx) => (
              <li key={tx.id} className="rounded-lg border p-3">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {tx.date} / {tx.category} (
                      {tx.type === "expense" ? "支出" : "収入"})
                    </p>
                    {tx.memo && (
                      <p className="text-xs text-zinc-600">{tx.memo}</p>
                    )}
                  </div>
                  <p className="text-sm font-semibold">
                    {tx.amount.toLocaleString()}円
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
