// app/kakeibo/_lib/dateTypes.ts
export type Ym = `${number}-${
  | "01" | "02" | "03" | "04" | "05" | "06"
  | "07" | "08" | "09" | "10" | "11" | "12"
}`;

export const isYm = (v: string): v is Ym => /^\d{4}-(0[1-9]|1[0-2])$/.test(v);

export function safeParseYm(v: string, fallback: Ym): Ym {
  return isYm(v) ? v : fallback;
}
