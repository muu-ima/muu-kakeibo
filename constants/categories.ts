export const EXPENSE_CATEGORIES = ["食費","日用品","家賃","交通費","習い事","雑費"] as const;
export const INCOME_CATEGORIES = ["給与","副収入","返金","その他"] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type Category = ExpenseCategory | IncomeCategory;
