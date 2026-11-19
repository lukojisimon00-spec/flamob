"use client";
import { useMemo, useState } from "react";
import { AgentCard } from "./Cards";
import { Icon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/feedback";
import type { ServicePoint, ServiceType } from "@/lib/db/schema";
import { serviceLabel } from "@/lib/labels";

export interface NetworkEntry { agentId: string; name: string; code: string; services: ServiceType[]; point: ServicePoint }

const BOUNDS = { minLng: 15.22, maxLng: 15.43, minLat: -4.42, maxLat: -4.29 };
const project = (lat: number, lng: number) => ({
  x: ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100,
  y: ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100,
});
function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export function AgentNetwork({ entries, initialPoint }: { entries: NetworkEntry[]; initialPoint?: string }) {
  const [commune, setCommune] = useState("");
  const [service, setService] = useState<ServiceType | "">("");
  const [openOnly, setOpenOnly] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(initialPoint ?? "");
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState("");
  const communes = [...new Set(entries.map((e) => e.point.commune))].sort();

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    const res = entries.filter((e) =>
      (!commune || e.point.commune === commune) && (!service || e.services.includes(service)) && (!openOnly || e.point.status === "open") &&
      (!n || [e.name, e.point.name, e.point.quarter, e.point.commune, e.code].some((s) => s.toLowerCase().includes(n))));
    return me ? res.sort((a, b) => km(me, a.point) - km(me, b.point)) : res;
  }, [entries, commune, service, openOnly, q, me]);

  const locate = () => {
    if (!("geolocation" in navigator)) return setGeoMsg("La géolocalisation n'est pas disponible sur cet appareil.");
    setGeoMsg("Localisation en cours…");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoMsg("Agents triés du plus proche au plus éloigné."); },
      () => setGeoMsg("Position non obtenue. Utilisez le filtre par commune."),
      { timeout: 10000, maximumAge: 600000 },
    );
  };

  const inBounds = me && me.lat >= BOUNDS.minLat && me.lat <= BOUNDS.maxLat && me.lng >= BOUNDS.minLng && me.lng <= BOUNDS.maxLng;
  const ctl = "h-10 rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 text-sm";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <figure className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          <div className="relative aspect-[16/11] bg-[linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] bg-[size:12.5%_12.5%] bg-navy-50/40">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
              <path d="M0 6 C20 2 35 10 55 4 S85 0 100 3 L100 0 L0 0Z" fill="var(--color-cyan-100)" />
            </svg>
            <span className="absolute left-3 top-2 text-[0.65rem] font-semibold uppercase tracking-wider text-cyan-700">Fleuve Congo</span>
            {entries.map((e) => {
              const p = project(e.point.lat, e.point.lng);
              const visible = list.some((l) => l.agentId === e.agentId);
              const on = selected === e.point.id;
              return (
                <button key={e.agentId} type="button" onClick={() => setSelected(e.point.id)}
                  className={`absolute -translate-x-1/2 -translate-y-full transition-opacity ${visible ? "" : "opacity-25"}`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }} aria-label={`${e.point.name}, ${e.point.commune}`} aria-pressed={on}>
                  <span className={`grid size-8 place-items-center rounded-full rounded-bl-none -rotate-45 border-2 border-white shadow ${on ? "bg-cyan" : e.point.status === "open" ? "bg-navy" : "bg-muted"}`}>
                    <span className="size-2 rotate-45 rounded-full bg-white" />
                  </span>
                </button>
              );
            })}
            {inBounds && me && (() => { const p = project(me.lat, me.lng); return <span className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-cyan-700 ring-4 ring-cyan/30" style={{ left: `${p.x}%`, top: `${p.y}%` }} aria-label="Votre position" />; })()}
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2 text-xs text-muted">
            <span>Carte schématique de Kinshasa — positions fictives</span>
            <span className="flex items-center gap-3"><span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-navy" />Ouvert</span><span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-muted" />Fermé</span></span>
          </figcaption>
        </figure>
        <button type="button" onClick={locate} className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] border border-line-strong bg-surface px-3.5 text-sm font-semibold text-navy hover:bg-navy-50">
          <Icon name="target" size={18} />Trier par distance
        </button>
        {geoMsg && <p className="text-xs text-muted" role="status">{geoMsg}{me && !inBounds ? " Vous semblez hors de la zone de démonstration (Kinshasa)." : ""}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-0 flex-1 basis-52">
            <span className="sr-only">Rechercher</span>
            <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, quartier, commune…" className={`${ctl} w-full pl-9`} />
          </label>
          <select value={commune} onChange={(e) => setCommune(e.target.value)} className={ctl} aria-label="Commune">
            <option value="">Toutes les communes</option>{communes.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={service} onChange={(e) => setService(e.target.value as ServiceType | "")} className={ctl} aria-label="Service">
            <option value="">Tous les services</option>{(Object.keys(serviceLabel) as ServiceType[]).map((s) => <option key={s} value={s}>{serviceLabel[s]}</option>)}
          </select>
          <label className="flex h-10 items-center gap-2 px-1 text-sm"><input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="size-4 accent-[var(--color-navy)]" />Ouverts uniquement</label>
        </div>
        <p className="text-sm text-muted" aria-live="polite">{list.length} point{list.length > 1 ? "s" : ""} de service</p>
        {list.length ? (
          <ul className="space-y-2.5">
            {list.map((e) => (
              <li key={e.agentId} onClick={() => setSelected(e.point.id)} className={`rounded-[var(--radius-card)] ${selected === e.point.id ? "ring-2 ring-cyan" : ""}`}>
                <AgentCard name={e.name} code={e.code} point={e.point} services={e.services} distance={me ? km(me, e.point) : undefined} />
              </li>
            ))}
          </ul>
        ) : <EmptyState icon="pin" title="Aucun point ne correspond">Élargissez vos filtres.</EmptyState>}
      </div>
    </div>
  );
}
