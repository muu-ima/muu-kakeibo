"use client";

import { useEffect, useMemo, useState } from "react";
import Section from "@/app/kakeibo/_components/Section";
import TxList from "@/app/kakeibo/_components/TxList";
import { useKakeiboSummary } from "@/app/kakeibo/_hooks/useKakeiboSummary";
import { supabase } from "@/lib/supabase.client";
import { toCsv, downloadText } from "@/lib/csv";
import { useRouter } from "next/navigation";
import {
  countTransactionsFiltered,
  listTransactionsFiltered,
  getTotalsFiltered,
  listTransactionsForExport,
  deleteTransaction,
  updateTransaction,
  type TransactionRow,
  type TxType,
} from "@/lib/transactions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";

const inputBase =
  "w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm";
const selectBase = inputBase + " pr-8";
const buttonBase =
  "rounded-lg border bg-white px-3 py-2 text-sm hover:bg-zinc-100";

function monthToRange(month: string) {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const last = new Date(y, m, 0).getDate();
  const from = `${month}-01`;
  const to = `${month}-${String(last).padStart(2, "0")}`;
  return { from, to };
}

export default function KakeiboListPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const { from, to } = useMemo(() => monthToRange(month), [month]);

  const [type, setType] = useState<"all" | TxType>("all");
  const [category, setCategory] = useState<string>("");
  const [q, setQ] = useState("");

  const [items, setItems] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [debouncedQ, setDebouncedQ] = useState("");

  const [page, setPage] = useState(1);
  const limit = 30;

  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [totals, setTotals] = useState({
    incomeTotal: 0,
    expenseTotal: 0,
    balance: 0,
  });

  const [editing, setEditing] = useState<TransactionRow | null>(null);

  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState<TxType>("expense");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editMemo, setEditMemo] = useState("");

  const fetchList = async () => {
    setLoading(true);

    const common = {
      from,
      to,
      type,
      category: category || undefined,
      q: debouncedQ || undefined,
    };

    try {
      const [t, c] = await Promise.all([
        getTotalsFiltered(common),
        countTransactionsFiltered(common),
      ]);

      setTotals(t);
      setTotal(c);

      const pages = Math.max(1, Math.ceil(c / limit));
      if (page > pages) {
        setPage(pages);
        return; // page変更で再実行
      }

      const rows = await listTransactionsFiltered({
        ...common,
        limit,
        offset: (page - 1) * limit,
      });

      setItems(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!email) return;
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, from, to, type, category, debouncedQ, page]);

  const handleDelete = async (id: string) => {
    if (!confirm("この取引を削除しますか？")) return;
    await deleteTransaction(id);
    await fetchList();
  };

  const handleOpenEdit = (tx: TransactionRow) => {
    setEditing(tx);
    setEditDate(tx.date);
    setEditType(tx.type);
    setEditCategory(tx.category);
    setEditAmount(String(tx.amount));
    setEditMemo(tx.memo ?? "");
  };

  const handleCloseEdit = () => {
    setEditing(null);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;

    const n = Number(editAmount);
    if (!Number.isFinite(n) || n <= 0) {
      alert("金額は1円以上で入力してください");
      return;
    }

    // type変更したのにカテゴリ未選択のまま、を防ぐ
    if (!editCategory) {
      alert("カテゴリを選んでください");
      return;
    }

    await updateTransaction({
      id: editing.id,
      date: editDate,
      type: editType,
      category: editCategory,
      amount: Math.floor(n),
      memo: editMemo.trim() ? editMemo.trim() : null,
    });

    setEditing(null);
    await fetchList();
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
    const id = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);

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

  // type=all で category 指定されたら意味が曖昧なので「選べない」運用がラク
  const categoryOptions =
    type === "expense"
      ? EXPENSE_CATEGORIES
      : type === "income"
      ? INCOME_CATEGORIES
      : [];

  const { balance } = useKakeiboSummary(items);

  if (!email) return <main className="p-6">loading...</main>;

  return (
    <main className="space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">取引一覧</h1>
          <p className="text-sm text-zinc-600">ログイン中: {email}</p>
        </div>

        <button className={buttonBase} onClick={() => router.push("/kakeibo")}>
          戻る
        </button>
      </header>
      <Section
        title="絞り込み"
        variant="muted"
        headerRight={
          <button
            type="button"
            className={buttonBase}
            onClick={handleExportCsv}
          >
            CSV出力
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-2">
          <input
            className={inputBase}
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setPage(1);
            }}
          />

          <select
            className={selectBase}
            value={type}
            onChange={(e) => {
              const v = e.target.value as "all" | TxType;
              setType(v);
              setCategory(""); // type切替でカテゴリ解除
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

      <Section title={`全件合計（条件一致:${month})`} variant="muted">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-zinc-500">収入</p>
            <p className="text-lg font-semibold">
              {totals.incomeTotal.toLocaleString()}円
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-zinc-500">支出</p>
            <p className="text-lg font-semibold">
              {totals.expenseTotal.toLocaleString()}円
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
              {totals.balance.toLocaleString()}円
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          ※絞り込み条件に一致する全件の合計{" "}
        </p>
      </Section>

      <Section
        title="取引"
        headerRight={
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              {total.toLocaleString()}件 / {page} / {totalPages}
            </span>

            <button
              className={buttonBase}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              前へ
            </button>

            <button
              className={buttonBase}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              次へ
            </button>
          </div>
        }
      >
        {loading ? (
          <p className="text-sm text-zinc-600">loading...</p>
        ) : (
          <TxList
            items={items}
            onDelete={handleDelete}
            onEdit={handleOpenEdit}
          />
        )}
      </Section>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={handleCloseEdit}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium">取引を編集</p>
              <button className={buttonBase} onClick={handleCloseEdit}>
                閉じる
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputBase}
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />

              <select
                className={selectBase}
                value={editType}
                onChange={(e) => {
                  const v = e.target.value as TxType;
                  setEditType(v);
                  // type切替時はカテゴリを初期化しておくと安全
                  setEditCategory(
                    v === "expense"
                      ? EXPENSE_CATEGORIES[0]
                      : INCOME_CATEGORIES[0]
                  );
                }}
              >
                <option value="expense">支出</option>
                <option value="income">収入</option>
              </select>

              <input
                className={inputBase}
                inputMode="numeric"
                placeholder="金額(円)"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />

              <select
                className={selectBase}
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              >
                {(editType === "expense"
                  ? EXPENSE_CATEGORIES
                  : INCOME_CATEGORIES
                ).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <input
              className={[inputBase, "mt-2"].join(" ")}
              placeholder="メモ（任意）"
              value={editMemo}
              onChange={(e) => setEditMemo(e.target.value)}
            />

            <div className="mt-4 flex justify-end gap-2">
              <button className={buttonBase} onClick={handleCloseEdit}>
                キャンセル
              </button>
              <button className={buttonBase} onClick={handleSaveEdit}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
