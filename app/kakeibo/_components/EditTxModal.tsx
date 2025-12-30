"use client";

import React from "react";
import Button from "@/app/kakeibo/_components/Button";
import type { TxType } from "@/lib/transactions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";

type Props = {
  open: boolean;

  editDate: string;
  editType: TxType;
  editCategory: string;
  editAmount: string;
  editMemo: string;

  setEditDate: (v: string) => void;
  setEditType: (v: TxType) => void;
  setEditCategory: (v: string) => void;
  setEditAmount: (v: string) => void;
  setEditMemo: (v: string) => void;

  onClose: () => void;
  onSave: () => void;

  inputBase: string;
  selectBase: string;
  buttonBase: string;
};


export default function EditTxModal({
  open,
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
  onClose,
  onSave,
  inputBase,
  selectBase,
  buttonBase,
}: Props) {
  if (!open) return null;

  const categories =
    editType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* 追加モーダル寄せ：広め + 余白多め */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        {/* ヘッダー */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold">取引を編集</h2>
          <button type="button" className={buttonBase} onClick={onClose}>
            閉じる
          </button>
        </div>

        {/* フォーム：縦積み */}
        <div className="space-y-3">
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
              const first =
                v === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0];
              setEditCategory(first);
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
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            className={inputBase}
            placeholder="メモ（任意）"
            value={editMemo}
            onChange={(e) => setEditMemo(e.target.value)}
          />
        </div>

        {/* フッター：追加モーダル寄せ（青い保存をドン） */}
        <div className="mt-6 space-y-3">
          <Button variant="primary" full onClick={onSave}>
            保存
          </Button>

          {/* 追加モーダルに合わせて、キャンセルは控えめに */}
          <button
            type="button"
            className="w-full text-sm text-zinc-500 hover:text-zinc-700"
            onClick={onClose}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
