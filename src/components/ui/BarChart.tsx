/**
 * Histogramme mono-série (ex. opérations par jour). Une seule teinte (cyan-700, contraste ≥ 3:1),
 * barres fines à extrémité arrondie ancrées sur la ligne de base, valeur au survol (title) et
 * table équivalente pour les lecteurs d'écran.
 */
export function BarChart({ data, label, unit = "" }: { data: { key: string; label: string; value: number }[]; label: string; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const peak = data.reduce((m, d) => (d.value > m.value ? d : m), data[0]);
  return (
    <figure>
      <div className="flex h-36 items-end gap-[2px] border-b border-line-strong" aria-hidden="true">
        {data.map((d) => (
          <div key={d.key} className="group relative flex h-full flex-1 items-end justify-center">
            <div className="w-full max-w-7 rounded-t-[4px] bg-cyan-700 group-hover:bg-navy" style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 2 : 0 }} />
            <span className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-navy px-2 py-1 font-mono text-[0.7rem] text-white group-hover:block">
              {d.label} · {d.value}{unit}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[0.68rem] text-muted" aria-hidden="true">
        <span>{data[0]?.label}</span><span>{data.at(-1)?.label}</span>
      </div>
      <figcaption className="mt-2 text-xs text-muted">{label} — maximum {peak?.value ?? 0}{unit} ({peak?.label}).</figcaption>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>{data.map((d) => <tr key={d.key}><th scope="row">{d.label}</th><td>{d.value}{unit}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
