import { useMemo } from "react";
import type { TransactionRow } from "@/lib/transactions";

export function useKakeiboSummary(items: TransactionRow[]) {
  return useMemo(() => {
    let income = 0;
    let expense = 0;

    const expMap: Record<string, number> = {};
    const incMap: Record<string, number> = {};

    for (const tx of items) {
      if (tx.type === "income") {
        income += tx.amount;
        incMap[tx.category] = (incMap[tx.category] ?? 0) + tx.amount;
      } else {
        expense += tx.amount;
        expMap[tx.category] = (expMap[tx.category] ?? 0) + tx.amount;
      }
    }

    return {
      incomeTotal: income,
      expenseTotal: expense,
      balance: income - expense,
      expenseByCategory: Object.entries(expMap).sort((a, b) => b[1] - a[1]),
      incomeByCategory: Object.entries(incMap).sort((a, b) => b[1] - a[1]),
    };
  }, [items]);
}
