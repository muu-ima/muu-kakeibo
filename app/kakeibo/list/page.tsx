"use client";

import { useEffect, useMemo, useState } from "react";
import Section from "@/app/kakeibo/_components/Section";
import TxList from "@/app/kakeibo/_components/TxList";
import EditTxModal from "@/app/kakeibo/_components/EditTxModal";
import Button from "@/app/kakeibo/_components/Button";
import { useKakeiboSummary } from "@/app/kakeibo/_hooks/useKakeiboSummary";
import { useKakeiboList } from "@/app/kakeibo/_hooks/useKakeiboList";
import { supabase } from "@/lib/supabase.client";
import { toCsv, downloadText } from "@/lib/csv";
import { useRouter } from "next/navigation";
import { listTransactionsForExport, type TxType } from "@/lib/transactions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";

type Ym = `${number}-${string}`; // "YYYY-MM"

const inputBase =
  "w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm";
const selectBase = inputBase + " pr-8";
const buttonBase =
  "rounded-lg border bg-white px-3 py-2 text-sm hover:bg-zinc-100";

function ymRangeToDateRange(fromYm: string, toYm: string) {
  const [a, b] = fromYm <= toYm ? [fromYm, toYm] : [toYm, fromYm];

  const [y, m] = b.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();

  return {
    from: `${a}-01`,
    to: `${b}-${String(last).padStart(2, "0")}`,
  };
}

export default function KakeiboListPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  const nowYm = new Date().toISOString().slice(0, 7) as Ym;
  const [fromYm, setFromYm] = useState<Ym>(nowYm);
  const [toYm, setToYm] = useState<Ym>(nowYm);

  const { from, to } = useMemo(
    () => ymRangeToDateRange(fromYm, toYm),
    [fromYm, toYm]
  );

  const [type, setType] = useState<"all" | TxType>("all");
  const [category, setCategory] = useState<string>("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const limit = 30;
  const {
    items,
    totals,
    total,
    loading,
    page,
    setPage,
    editing,
    editDate,
    editType,
    editCategory,
    editAmount,
    editMemo,
    setEditDate,
    setEditType,
    setEditCategory,
    setEditAmount,
    setEditMemo,
    fetchList,
    handleDelete,
    openEdit,
    closeEdit,
    saveEdit,
  } = useKakeiboList(limit);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const filters = useMemo(
    () => ({
      from,
      to,
      type,
      category: category || undefined,
      q: debouncedQ || undefined,
    }),
    [from, to, type, category, debouncedQ]
  );

  const handleSaveAndRefresh = async () => {
    await saveEdit();
    await fetchList(filters);
  };

  useEffect(() => {
    if (!email) return;
    fetchList(filters);
  }, [email, filters, page, fetchList]);

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
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const handleExportCsv = async () => {
    const rows = await listTransactionsForExport({
      from,
      to,
      type,
      category: category || undefined,
      q: debouncedQ || q || undefined,
    });

    const csv = toCsv(
      ["日付", "区分", "カテゴリ", "金額", "メモ"],
      rows,
      (r) => [
        r.date,
        r.type === "expense" ? "支出" : "収入",
        r.category,
        r.amount,
        r.memo ?? "",
      ]
    );

    downloadText(`kakeibo_${from}_${to}.csv`, csv, "text/csv;charset=utf-8;");
  };

  const categoryOptions =
    type === "expense"
      ? EXPENSE_CATEGORIES
      : type === "income"
      ? INCOME_CATEGORIES
      : [];

  const { balance } = useKakeiboSummary(items);

  if (!email) return <main className="p-6">loading...</main>;

  return (
    <main className="min-h-dvh bg-zinc-50">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header
          className="
            sticky top-0 z-20
            bg-white/80 backdrop-blur
            border-b border-zinc-200/60
            px-4 py-5
            flex justify-between
          "
        >
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">取引一覧</h1>
            <p className="text-xs text-zinc-500">ログイン中: ...</p>
          </div>
          <div className="flex justify-end sm:justify-normal">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 min-w-max whitespace-nowrap gap-1 px-2"
              onClick={() => router.back()}
            >
              ← 戻る
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[512px_1fr]">
          <div className="lg:sticky lg:top-6 h-fit space-y-6">
            <Section
              title="絞り込み"
              variant="muted"
              headerRight={
                <Button size="sm" onClick={handleExportCsv}>
                  CSV出力
                </Button>
              }
            >
              <div className="grid gap-2">
                {/* ✅ 月From/To */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500">開始（月）</p>
                    <input
                      className={inputBase}
                      type="month"
                      value={fromYm}
                      onChange={(e) => {
                        setFromYm(e.target.value as Ym);
                        setPage(1);
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500">終了（月）</p>
                    <input
                      className={inputBase}
                      type="month"
                      value={toYm}
                      onChange={(e) => {
                        setToYm(e.target.value as Ym);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>

                <select
                  className={selectBase}
                  value={type}
                  onChange={(e) => {
                    const v = e.target.value as "all" | TxType;
                    setType(v);
                    setCategory("");
                    setPage(1);
                  }}
                >
                  <option value="all">全部</option>
                  <option value="expense">支出</option>
                  <option value="income">収入</option>
                </select>

                <input
                  className={inputBase}
                  placeholder="メモ検索（任意）"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                />

                <select
                  className={selectBase}
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  disabled={type === "all"}
                >
                  <option value="">
                    {type === "all"
                      ? "カテゴリ（typeを選んでね）"
                      : "カテゴリ（任意）"}
                  </option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </Section>

            {/* ✅ 表示も month -> fromYm/toYm */}
            <Section title={`全件合計（条件一致:${fromYm}〜${toYm}）`} variant="muted">
              <div className="rounded-xl bg-white/60">
                {[
                  ["収入", totals.incomeTotal.toLocaleString() + "円", "text-zinc-900"],
                  ["支出", totals.expenseTotal.toLocaleString() + "円", "text-zinc-900"],
                  ["差額", totals.balance.toLocaleString() + "円", balance < 0 ? "text-red-600" : "text-emerald-600"],
                ].map(([label, value, cls]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className={["text-sm font-semibold", cls].join(" ")}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                ※絞り込み条件に一致する全件の合計
              </p>
            </Section>
          </div>

          <div className="space-y-6">
            <Section
              title="取引"
              headerRight={
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    {total.toLocaleString()}件 / {page} / {totalPages}
                  </span>

                  <Button size="sm">前へ</Button>
                  <Button size="sm">次へ</Button>
                </div>
              }
            >
              {loading ? (
                <p className="text-sm text-zinc-600">loading...</p>
              ) : (
                <TxList items={items} onEdit={openEdit} onDelete={handleDelete} />
              )}
            </Section>

            <EditTxModal
              open={!!editing}
              editDate={editDate}
              editType={editType}
              editCategory={editCategory}
              editAmount={editAmount}
              editMemo={editMemo}
              setEditDate={setEditDate}
              setEditType={setEditType}
              setEditCategory={setEditCategory}
              setEditAmount={setEditAmount}
              setEditMemo={setEditMemo}
              onSave={handleSaveAndRefresh}
              onClose={closeEdit}
              inputBase={inputBase}
              selectBase={selectBase}
              buttonBase={buttonBase}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
