/** Monogramme généré pour les banques fictives (aucun logo réel n'est reproduit). */
export function BankLogo({ name, shortName, color, size = 44 }: { name: string; shortName: string; color: string; size?: number }) {
  return (
    <span role="img" aria-label={`Logo de ${name} (fictif)`}
      className="grid shrink-0 place-items-center rounded-xl font-mono font-semibold text-white"
      style={{ background: color, width: size, height: size, fontSize: size * 0.3 }}>
      {shortName.slice(0, 3)}
    </span>
  );
}
