"use client";

import React from "react";
import type { TxType } from "@/lib/transactions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";

type Props = {
  open: boolean;

  // state
  editDate: string;
  editType: TxType;
  editCategory: string;
  editAmount: string;
  editMemo: string;

  // setters
  setEditDate: (v: string) => void;
  setEditType: (v: TxType) => void;
  setEditCategory: (v: string) => void;
  setEditAmount: (v: string) => void;
  setEditMemo: (v: string) => void;

  // actions
  onClose: () => void;
  onSave: () => void;

  // styles
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

      <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-medium">取引を編集</p>
          <button className={buttonBase} onClick={onClose}>
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

              // type切替時：カテゴリが空/不正になりやすいので初期化
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
        </div>

        <input
          className={[inputBase, "mt-2"].join(" ")}
          placeholder="メモ（任意）"
          value={editMemo}
          onChange={(e) => setEditMemo(e.target.value)}
        />

        <div className="mt-4 flex justify-end gap-2">
          <button className={buttonBase} onClick={onClose}>
            キャンセル
          </button>
          <button className={buttonBase} onClick={onSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
