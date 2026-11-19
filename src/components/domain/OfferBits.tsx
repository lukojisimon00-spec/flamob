import type { Money } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";

export function Price({ value }: { value: Money | null }) {
  if (!value) return <span className="text-muted">Non communiqué</span>;
  if (value.amount === 0) return <span className="font-mono">Gratuit</span>;
  return <span className="font-mono tabular">{formatMoney(value.amount, value.currency)}</span>;
}
