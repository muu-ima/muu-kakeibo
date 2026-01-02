// app/kakeibo/page.tsx
"use client";

import { useEffect, useState } from "react";

import Section from "@/app/kakeibo/_components/Section";
import CategorySummaryCard from "@/app/kakeibo/_components/CategorySummary";
import TxList from "@/app/kakeibo/_components/TxList";
import AddTxModal from "@/app/kakeibo/_components/AddTxModal";
import Toast from "@/app/kakeibo/_components/Toast";
import Button from "@/app/kakeibo/_components/Button";
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
      {/* 背景の“ほわっ”を足す（Canvaっぽい） */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-180 -translate-x-1/2 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute top-40 left-10 h-64 w-64 rounded-full bg-white/40 blur-3xl" />
        <div className="absolute top-60 right-10 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
      </div>

      {/* Sticky Header */}
      <header
        className="
        sticky top-0 z-20
        backdrop-blur
        flex items-center justify-between
        border-b border-white/40
        bg-white/70
        px-4 py-5
      "
      >
        <div>
          <h1 className="text-xl font-semibold tracking-tight">家計簿</h1>
          <p className="text-xs text-zinc-500">{email}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* 追加ボタン（PC） */}
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            ＋ 追加
          </Button>

          {/* ログアウトは控えめ（ガラス寄せ） */}
          <button
            type="button"
            className="
            rounded-full px-3 py-2 text-xs
            bg-white/60 backdrop-blur
            ring-1 ring-zinc-200/60
            hover:bg-white/80
          "
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
          >
            ログアウト
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-10 pt-6">
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
            {/* 今月の残高（主役：Canva風ガラス） */}
            <Section title={`今月の取引（${month}）`} variant="muted">
              <div
                className="
                rounded-3xl
                bg-white/60 backdrop-blur
                ring-1 ring-zinc-200/60
                shadow-[0_10px_30px_rgba(0,0,0,0.06)]
                p-6
              "
              >
                <p className="text-xs text-zinc-500">残高</p>

                <p
                  className={[
                    "mt-1 font-semibold tracking-tight tabular-nums",
                    "text-3xl sm:text-4xl",
                    balance < 0 ? "text-red-600" : "text-emerald-600",
                  ].join(" ")}
                >
                  {balance.toLocaleString()}
                  <span className="ml-1 text-lg font-medium text-zinc-500">
                    円
                  </span>
                </p>

                {/* 収入/支出（チップ風：border→ringに変更） */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-zinc-200/60">
                    <p className="text-xs text-zinc-500">収入</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums">
                      {incomeTotal.toLocaleString()}
                      <span className="ml-1 text-xs font-medium text-zinc-500">
                        円
                      </span>
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-zinc-200/60">
                    <p className="text-xs text-zinc-500">支出</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums">
                      {expenseTotal.toLocaleString()}
                      <span className="ml-1 text-xs font-medium text-zinc-500">
                        円
                      </span>
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                  ※この画面は最新10件の合計
                </p>
              </div>
            </Section>

            {/* カテゴリ（ここも後でガラス化できるけど一旦そのまま） */}
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

          {/* 右：最新の取引（右もガラスで統一） */}
          <div className="lg:sticky lg:top-24">
            <Section
              title="最新の取引10件"
              headerRight={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/kakeibo/list")}
                >
                  一覧を見る →
                </Button>
              }
            >
              <div
                className="
                rounded-3xl
                bg-white/60 backdrop-blur
                ring-1 ring-zinc-200/60
                shadow-[0_10px_30px_rgba(0,0,0,0.06)]
              "
              >
                <div className="p-2">
                  <TxList items={items} readOnly />
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>

      {/* FAB（そのままでOK：ちょい上品にするなら ring 追加） */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="
        fixed bottom-6 right-6 z-50
        inline-flex h-14 w-14 items-center justify-center
        rounded-full bg-blue-600 text-white
        shadow-[0_12px_30px_rgba(0,0,0,0.20)]
        hover:bg-blue-700 active:bg-blue-800
        focus:outline-none focus:ring-4 focus:ring-blue-400/40
        sm:hidden
        transition-all duration-200 ease-out
        hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.22)]
        active:translate-y-0 active:scale-95
      "
        aria-label="追加"
      >
        <span className="text-2xl leading-none">＋</span>
      </button>
    </main>
  );
}
