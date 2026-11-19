"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/icons";
import type { ApplicationDocument } from "@/lib/db/schema";

const MAX = 6, MAX_BYTES = 10 * 1024 * 1024;

/**
 * Sélection de documents de DÉMONSTRATION : seuls le nom, le type déclaré et la taille sont transmis.
 * Le contenu du fichier ne quitte jamais l'appareil (pas d'envoi, pas de stockage).
 */
export function DocumentPicker({ name = "documents", initial = [], kinds }: { name?: string; initial?: ApplicationDocument[]; kinds: string[] }) {
  const [docs, setDocs] = useState<ApplicationDocument[]>(initial);
  const [kind, setKind] = useState(kinds[0] ?? "Pièce d'identité");
  const [error, setError] = useState("");
  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(docs)} />
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 basis-48 text-sm">
          <span className="mb-1 block font-semibold">Type de document</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-11 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3">
            {kinds.map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 text-sm font-semibold text-navy hover:bg-navy-50 has-disabled:opacity-50">
          <Icon name="plus" size={18} />Ajouter un fichier
          <input type="file" className="sr-only" accept="image/*,application/pdf" disabled={docs.length >= MAX}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (f.size > MAX_BYTES) return setError("Fichier trop volumineux (10 Mo maximum).");
              setError("");
              setDocs((d) => [...d, { name: f.name.slice(0, 120), kind, sizeBytes: f.size }]);
            }} />
        </label>
      </div>
      {error && <p className="text-sm font-medium text-danger" role="alert">{error}</p>}
      {docs.length > 0 ? (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {docs.map((d, i) => (
            <li key={i} className="flex items-center gap-3 px-3 py-2.5 text-sm">
              <Icon name="file" size={18} className="text-muted" />
              <span className="min-w-0 flex-1"><span className="block truncate font-medium">{d.name}</span><span className="text-xs text-muted">{d.kind} · {(d.sizeBytes / 1024).toFixed(0)} Ko</span></span>
              <button type="button" onClick={() => setDocs((x) => x.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-danger-bg hover:text-danger" aria-label={`Retirer ${d.name}`}><Icon name="x" size={16} /></button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">Aucun document ajouté.</p>}
      <p className="text-xs text-muted">Démonstration : le contenu des fichiers n&apos;est ni envoyé ni conservé. N&apos;utilisez pas de vrais documents d&apos;identité.</p>
    </div>
  );
}
