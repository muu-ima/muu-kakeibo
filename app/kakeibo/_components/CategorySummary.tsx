export default function CategorySummaryCard({
  title,
  items,
}: {
  title: string;
  items: [string, number][];
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
      <p className="text-sm font-semibold">{title}</p>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">データなし</p>
      ) : (
        <ul className="space-y-1">
          {items.map(([cat, total]) => (
            <li key={cat} className="flex justify-between py-2 text-sm">
              <span className="text-zinc-700">{cat}</span>
              <span className="font-semibold">{total.toLocaleString()}円</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
