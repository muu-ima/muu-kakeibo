"use client";

import { useState, useCallback } from "react";
import {
  countTransactionsFiltered,
  listTransactionsFiltered,
  getTotalsFiltered,
  deleteTransaction,
  updateTransaction,
  type TransactionRow,
  type TxType,
} from "@/lib/transactions";

type Filters = {
  from: string;
  to: string;
  type: "all" | TxType;
  category?: string;
  q?: string;
};

export function useKakeiboList(limit: number) {
  const [items, setItems] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [total, setTotal] = useState(0);
  const [totals, setTotals] = useState({
    incomeTotal: 0,
    expenseTotal: 0,
    balance: 0,
  });

  const [page, setPage] = useState(1);

  // 編集用
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState<TxType>("expense");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editMemo, setEditMemo] = useState("");

  const fetchList = useCallback(
    async (filters: Filters) => {
      setLoading(true);

      try {
        const [t, c] = await Promise.all([
          getTotalsFiltered(filters),
          countTransactionsFiltered(filters),
        ]);

        setTotals(t);
        setTotal(c);

        const pages = Math.max(1, Math.ceil(c / limit));
        if (page > pages) {
          setPage(pages);
          return;
        }

        const rows = await listTransactionsFiltered({
          ...filters,
          limit,
          offset: (page - 1) * limit,
        });

        setItems(rows);
      } finally {
        setLoading(false);
      }
    },
    [limit, page]
  );

  const handleDelete = async (id: string) => {
    if (!confirm("この取引を削除しますか？")) return;

    await deleteTransaction(id);

    // 空ページ対策
    if (items.length === 1 && page > 1) {
      setPage((p) => p - 1);
      return;
    }

    // 再取得は呼び出し側で
  };

  const openEdit = (tx: TransactionRow) => {
    setEditing(tx);
    setEditDate(tx.date);
    setEditType(tx.type);
    setEditCategory(tx.category);
    setEditAmount(String(tx.amount));
    setEditMemo(tx.memo ?? "");
  };

  const closeEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;

    const n = Number(editAmount);
    if (!Number.isFinite(n) || n <= 0) {
      alert("金額は1円以上で入力してください");
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
  };

  return {
    // data
    items,
    totals,
    total,
    loading,
    page,

    // paging
    setPage,

    // edit modal
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

    // actions
    fetchList,
    handleDelete,
    openEdit,
    closeEdit,
    saveEdit,
  };
}
