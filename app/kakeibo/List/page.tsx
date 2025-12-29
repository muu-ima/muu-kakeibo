// app/kakeibo/list/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Section from "@/app/kakeibo/_components/Section";
import TxList from "@/app/kakeibo/_components/TxList";
import { useKakeiboSummary } from "@/app/kakeibo/_hooks/useKakeiboSummary";
import { supabase } from "@/lib/supabase.client";
import { useRouter } from "next/navigation";
import { listTransactions, type TransactionRow, type TxType } from "@/lib/transactions";

const inputBase =
  "w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm";
const selectBase = inputBase + " pr-8";

export default function KakeiboListPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [items, setItems] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<"all" | TxType>("all");

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
      setLoading(true);
      const rows = await listTransactions(month);
      setItems(rows);
      setLoading(false);
    })();
  }, [email, month]);

  // type フィルタはまずクライアントでOK（データ増えたらSQL側へ）
  const filtered = useMemo(() => {
    if (type === "all") return items;
    return items.filter((x) => x.type === type);
  }, [items, type]);

  const { incomeTotal, expenseTotal, balance } = useKakeiboSummary(filtered);

  if (!email) return <main className="p-6">loading...</main>;

  return (
    <main className="space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">取引一覧</h1>
          <p className="text-sm text-zinc-600">ログイン中: {email}</p>
        </div>

        <button
          className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-zinc-100"
          onClick={() => router.push("/kakeibo")}
        >
          戻る
        </button>
      </header>

      <Section title="絞り込み" variant="muted">
        <div className="grid grid-cols-2 gap-2">
          <input
            className={inputBase}
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />

          <select
            className={selectBase}
            value={type}
            onChange={(e) => setType(e.target.value as "all" | TxType)}
          >
            <option value="all">全部</option>
            <option value="expense">支出</option>
            <option value="income">収入</option>
          </select>
        </div>
      </Section>

      <Section title={`表示中の合計（${month}）`} variant="ring">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-zinc-500">収入</p>
            <p className="text-lg font-semibold">{incomeTotal.toLocaleString()}円</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-zinc-500">支出</p>
            <p className="text-lg font-semibold">{expenseTotal.toLocaleString()}円</p>
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

      <Section title="取引">
        {loading ? <p className="text-sm text-zinc-600">loading...</p> : <TxList items={filtered} />}
      </Section>
    </main>
  );
}
