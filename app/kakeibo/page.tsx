// app/kakeibo/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
const primaryButton =
  "inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_14px_28px_rgba(0,0,0,0.18)] hover:bg-zinc-800 active:translate-y-[1px] disabled:opacity-50";

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
      <header className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/70 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧾</span>
                <h1 className="text-lg font-semibold tracking-tight">家計簿</h1>
                <span className="hidden sm:inline text-xs text-zinc-400">
                  /
                </span>
                <p className="hidden sm:block text-xs text-zinc-500">
                  {month} のサマリー
                </p>
              </div>

              <p className="mt-0.5 truncate text-xs text-zinc-500">{email}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className={primaryButton}
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-4 w-4" />
                追加
              </button>

              <button
                type="button"
                className={[
                  "rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm",
                  "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                ].join(" ")}
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.replace("/login");
                }}
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pt-6 pb-8">
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
    </main>
  );
}
