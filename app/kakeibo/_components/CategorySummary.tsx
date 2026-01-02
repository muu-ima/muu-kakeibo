export default function CategorySummaryCard({
  title,
  items,
}: {
  title: string;
  items: [string, number][];
}) {
  return (
    <div
      className="
        rounded-3xl
        bg-white/60 backdrop-blur
        ring-1 ring-zinc-200/60
        shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        p-5
        space-y-4
      "
    >
      <p className="text-sm font-semibold tracking-tight">{title}</p>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">データなし</p>
      ) : (
        <ul className="divide-y divide-zinc-200/60">
          {items.map(([cat, total]) => (
            <li
              key={cat}
              className="flex items-center justify-between py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                {/* さりげない順位ドット（Canva感） */}
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400/70" />
                <span className="text-zinc-700">{cat}</span>
              </div>

              <span className="font-semibold tabular-nums text-zinc-900">
                {total.toLocaleString()}
                <span className="ml-1 text-xs font-medium text-zinc-500">
                  円
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
