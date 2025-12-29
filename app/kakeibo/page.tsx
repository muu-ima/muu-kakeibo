// app/kakeibo/page.tsx
"use client";

import { useEffect, useState } from "react";
import Section from "@/app/kakeibo/_components/Section";
import CategorySummaryCard from "@/app/kakeibo/_components/CategorySummary";
import TxList from "@/app/kakeibo/_components/TxList";
import AddTxModal from "@/app/kakeibo/_components/AddTxModal";
import { useKakeiboSummary } from "@/app/kakeibo/_hooks/useKakeiboSummary";
import { supabase } from "@/lib/supabase.client";
import { useRouter } from "next/navigation";
import {
  listTransactionsLatest,
  type TransactionRow,
} from "@/lib/transactions";


const inputBase =
  "w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm";
const selectBase = inputBase + " pr-8";
const buttonBase =
  "rounded-lg border bg-white px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50";

export default function KakeiboPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  const [items, setItems] = useState<TransactionRow[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [month] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM

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
      const rows = await listTransactionsLatest(10);
      setItems(rows);
    })();
  }, [email]);

  const refreshLatest = async () => {
    const rows = await listTransactionsLatest(10);
    setItems(rows);
  };

  useEffect(() => {
    if (!email) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshLatest();
  }, [email]);

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

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={buttonBase}
            onClick={() => setAddOpen(true)}
          >
            +追加
          </button>

          <button
            type="button"
            className={buttonBase}
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
          >
            ログアウト
          </button>
        </div>
      </header>
      <AddTxModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={refreshLatest}
        inputBase={inputBase}
        selectBase={selectBase}
        buttonBase={buttonBase}
        defaultDate={new Date().toISOString().slice(0, 10)}
        defaultType="expense"
      />

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
        title="最新の取引"
        headerRight={
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => router.push("/kakeibo/list")}
          >
            一覧を見る →
          </button>
        }
      >
        <TxList items={items} />
      </Section>
    </div>
  );
}
