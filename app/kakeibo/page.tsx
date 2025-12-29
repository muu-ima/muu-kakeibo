// app/kakeibo/page.tsx
"use client";

import { useEffect, useState } from "react";

import Section from "@/app/kakeibo/_components/Section";
import CategorySummaryCard from "@/app/kakeibo/_components/CategorySummary";
import TxList from "@/app/kakeibo/_components/TxList";
import AddTxModal from "@/app/kakeibo/_components/AddTxModal";
import Toast from "@/app/kakeibo/_components/Toast";
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
const addButton =
  "inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50";
const primaryButton =
  "inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_14px_28px_rgba(0,0,0,0.18)] hover:bg-zinc-800 active:translate-y-[1px] disabled:opacity-50";

export default function KakeiboPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  const [items, setItems] = useState<TransactionRow[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [month] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setEmail(data.session.user.email ?? null);
    });
  }, [router]);

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
    <main className="min-h-dvh bg-zinc-50">
      {/* Sticky Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">家計簿</h1>
          <p className="text-xs text-zinc-500">{email}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* 追加ボタン（PC） */}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="
            hidden sm:inline-flex items-center gap-2
            rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white
            shadow-sm hover:bg-blue-700 active:bg-blue-800
            focus:outline-none focus:ring-2 focus:ring-blue-400/50
          "
          >
            <span className="text-lg leading-none">＋</span>
            追加
          </button>

          {/* ログアウトは控えめ */}
          <button
            type="button"
            className="rounded-full border px-3 py-2 text-xs hover:bg-zinc-100"
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
          >
            ログアウト
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pt-6 pb-8">
        <AddTxModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSaved={async () => {
            await refreshLatest();
            setToastOpen(true);
          }}
          inputBase={inputBase}
          selectBase={selectBase}
          buttonBase={buttonBase}
          defaultDate={new Date().toISOString().slice(0, 10)}
          defaultType="expense"
        />

        <Toast
          open={toastOpen}
          message="保存しました"
          onClose={() => setToastOpen(false)}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* 左：サマリー */}
          <div className="space-y-6">
            {/* 月合計 */}
            <Section title={`月合計（${month}）`} variant="muted">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 backdrop-blur">
                {[
                  {
                    label: "収入",
                    value: `${incomeTotal.toLocaleString()}円`,
                    valueClass: "",
                  },
                  {
                    label: "支出",
                    value: `${expenseTotal.toLocaleString()}円`,
                    valueClass: "",
                  },
                  {
                    label: "差額",
                    value: `${balance.toLocaleString()}円`,
                    valueClass:
                      balance < 0 ? "text-red-600" : "text-emerald-600",
                  },
                ].map((r, i) => (
                  <div
                    key={r.label}
                    className={[
                      "flex items-center justify-between px-4 py-3",
                      i !== 0 ? "border-t border-zinc-100" : "",
                    ].join(" ")}
                  >
                    <p className="text-xs text-zinc-500">{r.label}</p>
                    <p
                      className={[
                        "text-sm font-semibold tabular-nums",
                        r.valueClass,
                      ].join(" ")}
                    >
                      {r.value}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                ※この画面は最新10件の合計
              </p>
            </Section>

            {/* カテゴリ */}
            <div className="grid gap-4 sm:grid-cols-2">
              <CategorySummaryCard
                title="カテゴリ別合計（収入）"
                items={incomeByCategory}
              />
              <CategorySummaryCard
                title="カテゴリ別合計（支出）"
                items={expenseByCategory}
              />
            </div>
          </div>

          {/* 右：最新の取引 */}
          <div className="lg:sticky lg:top-20">
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
        </div>
      </div>
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="
    fixed bottom-6 right-6 z-50
    inline-flex h-14 w-14 items-center justify-center
    rounded-full bg-blue-600 text-white shadow-xl
    hover:bg-blue-700 active:bg-blue-800
    focus:outline-none focus:ring-4 focus:ring-blue-400/40
    sm:hidden
     transition-all duration-200 ease-out
      hover:-translate-y-0.5 hover:shadow-2xl
      active:translate-y-0 active:scale-95
        "
        aria-label="追加"
      >
        <span className="text-2xl leading-none">＋</span>
      </button>
    </main>
  );
}
