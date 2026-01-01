"use client";

import { useEffect, useState } from "react";
import DatePicker from "@/app/kakeibo/_components/DatePicker";
import type { TxType } from "@/lib/transactions";
import { addTransaction } from "@/lib/transactions";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Category,
} from "@/constants/categories";

export default function AddTxModal(props: {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  inputBase: string;
  selectBase: string;
  buttonBase: string;
  defaultDate: string; // "YYYY-MM-DD"
  defaultType?: TxType;
}) {
  const { open, onClose, defaultDate, defaultType = "expense" } = props;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // key を変えると中身が再マウントされる（= stateが初期化される）
  const key = `${defaultDate}-${defaultType}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <AddTxModalInner key={key} {...props} />
      </div>
    </div>
  );
}

function AddTxModalInner({
  onClose,
  onSaved,
  inputBase,
  selectBase,
  buttonBase,
  defaultDate,
  defaultType = "expense",
}: {
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  inputBase: string;
  selectBase: string;
  buttonBase: string;
  defaultDate: string;
  defaultType?: TxType;
}) {
  const [date, setDate] = useState(() => defaultDate);
  const [type, setType] = useState<TxType>(() => defaultType);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>(() =>
    defaultType === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]
  );

  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSave = async () => {
    if (saving) return; // ✅ 二重送信防止（ガード）
    setSaveError(null);

    try {
      setSaving(true);

      await addTransaction({
        date,
        type,
        category,
        amount: Number(amount || 0),
        memo: memo || undefined,
      });

      onClose();
      await onSaved();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "保存に失敗しました";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    console.log("type:", type, "category:", category);
  }, [type, category]);

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">取引を追加</p>
        <button className={buttonBase} onClick={onClose}>
          閉じる
        </button>
      </div>

      <div className="space-y-2">
        <DatePicker value={date} onChange={setDate} />

        <select
          className={selectBase}
          value={type}
          onChange={(e) => {
            const nextType = e.target.value as TxType;
            setType(nextType);
            setCategory(
              nextType === "expense"
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
          placeholder="金額(円)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          className={selectBase}
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          {(type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(
            (c) => (
              <option key={c} value={c}>
                {c}
              </option>
            )
          )}
        </select>

        <input
          className={inputBase}
          placeholder="メモ（任意）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <button
        className={[
          "mt-3 w-full rounded-lg py-2 text-sm font-semibold text-white",
          saving
            ? "bg-blue-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700",
        ].join(" ")}
        onClick={onSave}
        disabled={saving}
      >
        {saving ? "保存中..." : "保存"}
      </button>
      {saveError && <p className="mt-2 text-sm text-red-600">{saveError}</p>}
    </>
  );
}
