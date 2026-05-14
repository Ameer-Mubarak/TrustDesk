import type { Risk } from '../lib/types';

const riskClass: Record<Risk, string> = {
  low: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-900',
  high: 'bg-orange-100 text-orange-900',
  critical: 'bg-red-100 text-red-900'
};

export function RiskBadge({ risk }: { risk: Risk }) {
  return <span className={`status-pill ${riskClass[risk]}`}>{risk}</span>;
}

export function StatusBadge({ value }: { value: string }) {
  return <span className="status-pill bg-stone-100 text-moss">{value.replace(/_/g, ' ')}</span>;
}
