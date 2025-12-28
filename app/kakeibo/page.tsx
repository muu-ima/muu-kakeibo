// app/kakeibo/page.tsx
"use client";

import { useEffect, useState } from "react";
import Section from "@/app/kakeibo/_components/Section";
import CategorySummaryCard from "@/app/kakeibo/_components/CategorySummary";
import TxList from "@/app/kakeibo/_components/TxList";
import { useKakeiboSummary } from "@/app/kakeibo/_hooks/useKakeiboSummary";
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

const inputBase =
  "w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm";
const selectBase = inputBase + " pr-8";
const buttonPrimary =
  "w-full rounded-lg bg-blue-500 px-3 py-2 text-white hover:bg-blue-800";

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
  } = useKakeiboSummary(items);

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
      <Section title="追加" variant="ring">
        <div className="grid grid-cols-2 gap-2">
          <input
            className={inputBase}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <select
            className={selectBase}
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
            className={inputBase}
            inputMode="numeric"
            placeholder="金額(円)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select
            className={selectBase}
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
          className={[inputBase, "mt-2"].join(" ")}
          placeholder="メモ（任意）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        <button
          className={[buttonPrimary, "mt-2.5"].join(" ")}
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
      </Section>

      <Section title={`月合計（${month}）`} variant="muted">
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
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <CategorySummaryCard
          title="カテゴリ別合計（収入）"
          items={incomeByCategory}
        />
        <CategorySummaryCard
          title="カテゴリ別合計（支出）"
          items={expenseByCategory}
        />
      </div>

      {/* 一覧 */}
      <Section
        title="一覧"
        headerRight={
          <input
            type="month"
            className={[inputBase, "w-40"].join(" ")}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        }
      >
        <TxList items={items} />
      </Section>
    </div>
  );
}
