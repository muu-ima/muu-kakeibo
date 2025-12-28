// app/kakeibo/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase.client";
import { useRouter } from "next/navigation";
import {
  addTransaction,
  listTransactions,
  type TxType,
  type TransactionRow,
} from "@/lib/transactions";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type ExpenseCategory,
  type IncomeCategory,
} from "@/constants/categories";

export default function KakeiboPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [memo, setMemo] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<TransactionRow[]>([]);
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  ); // YYYY-MM

  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>(
    EXPENSE_CATEGORIES[0]
  );
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory>(
    INCOME_CATEGORIES[0]
  );

  const currentCategory = type === "expense" ? expenseCategory : incomeCategory;

  const setCurrentCategory = (v: ExpenseCategory | IncomeCategory) => {
    if (type === "expense") {
      setExpenseCategory(v as ExpenseCategory);
    } else {
      setIncomeCategory(v as IncomeCategory);
    }
  };

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

  const {
    incomeTotal,
    expenseTotal,
    balance,
    expenseByCategory,
    incomeByCategory,
  } = useMemo(() => {
    let income = 0;
    let expense = 0;

    const expMap: Record<string, number> = {};
    const incMap: Record<string, number> = {};

    for (const tx of items) {
      if (tx.type === "income") {
        income += tx.amount;
        incMap[tx.category] = (incMap[tx.category] ?? 0) + tx.amount;
      } else {
        expense += tx.amount;
        expMap[tx.category] = (expMap[tx.category] ?? 0) + tx.amount;
      }
    }
    return {
      incomeTotal: income,
      expenseTotal: expense,
      balance: income - expense,
      expenseByCategory: Object.entries(expMap).sort((a, b) => b[1] - a[1]),
      incomeByCategory: Object.entries(incMap).sort((a, b) => b[1] - a[1]),
    };
  }, [items]);

  if (!email) return <main className="p-6">loading...</main>;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">家計簿</h1>
          <p className="text-sm text-zinc-600">ログイン中: {email}</p>
        </div>

        <button
          className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-zinc-100"
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
        >
          ログアウト
        </button>
      </header>

      {/* 追加 */}
      <section className="max-w-3xl space-y-2 rounded-xl border p-4">
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
            onChange={(e) => {
              const nextType = e.target.value as TxType;
              setType(nextType);

              if (nextType === "expense")
                setExpenseCategory(EXPENSE_CATEGORIES[0]);
              else setIncomeCategory(INCOME_CATEGORIES[0]);
            }}
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

          <select
            className="w-full rounded-lg border p-2"
            value={currentCategory}
            onChange={(e) =>
              setCurrentCategory(
                e.target.value as ExpenseCategory | IncomeCategory
              )
            }
          >
            {(type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              )
            )}
          </select>
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
              if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
                setError("金額は1円以上で入力してください");
                return;
              }

              await addTransaction({
                date,
                type,
                amount: Math.floor(amountNumber),
                category: currentCategory,
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

      <section className="max-w-3xl space-y-2 rounded-xl border p-4 bg-zinc-50">
        <p className="text-sm font-medium mb-2">月合計（{month}）</p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-zinc-500">収入</p>
            <p className="text-lg font-semibold">
              {incomeTotal.toLocaleString()}円
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-xs text-zinc-500">支出</p>
            <p className="text-lg font-semibold">
              {expenseTotal.toLocaleString()}円
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-xs text-zinc-500">差額</p>
            <p
              className={[
                "text-lg font-semibold",
                balance < 0 ? "text-red-600" : "text-emerald-600",
              ].join(" ")}
            >
              {balance.toLocaleString()}円
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
          <p className="text-sm font-semibold">カテゴリ別合計（収入）</p>
          {incomeByCategory.length === 0 ? (
            <p className="text-sm text-zinc-500">データ無し</p>
          ) : (
            <ul className="space-y-1">
              {incomeByCategory.map(([cat, total]) => (
                <li key={cat} className="flex justify-between py-2 text-sm">
                  <span className="text-zinc-700">{cat}</span>
                  <span className="font-semibold">
                    {total.toLocaleString()}円
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
          <p className="text-sm font-semibold">カテゴリ別合計（支出）</p>
          {expenseByCategory.length === 0 ? (
            <p className="text-sm text-zinc-500">データなし</p>
          ) : (
            <ul className="space-y-1">
              {expenseByCategory.map(([cat, total]) => (
                <li key={cat} className="flex justify-between py-2 text-sm">
                  <span className="text-zinc-700">{cat}</span>
                  <span className="font-semibold">
                    {total.toLocaleString()}円
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 一覧 */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm font-semibold">一覧</p>
          <input
            type="month"
            className="rounded-lg border border-zinc-200 bg-white p-2 text-sm"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">データなし</p>
        ) : (
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
                    {tx.memo && (
                      <p className="text-xs text-zinc-500">{tx.memo}</p>
                    )}
                  </div>

                  <p className="text-sm font-semibold whitespace-nowrap">
                    {tx.amount.toLocaleString()}円
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
