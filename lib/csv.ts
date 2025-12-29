// lib/csv.ts
export function toCsv<T extends Record<string, unknown>>(
  header: string[],
  rows: T[],
  mapRow: (row: T) => (string | number | null | undefined)[]
) {
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    if (/[,"\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };

  const lines = [
    header.join(","),
    ...rows.map((r) => mapRow(r).map(escape).join(",")),
  ];

  // BOM 付き（Excel 対策）
  return "\uFEFF" + lines.join("\n");
}

export function downloadText(
  filename: string,
  text: string,
  mime = "text/plain;charset=utf-8;"
) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
