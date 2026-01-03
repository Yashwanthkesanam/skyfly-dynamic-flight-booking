// FILE: components/PriceBreakdown.tsx
import { PriceBreakdown as PriceBreakdownType } from '../types';
import { format } from 'date-fns';

interface PriceBreakdownProps {
  breakdown: PriceBreakdownType;
}

export default function PriceBreakdown({ breakdown }: PriceBreakdownProps) {
  // Helpers to format currency
  const formatINR = (val: number) =>
    val.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm">
        <span className="text-[var(--muted)]">Base Fare</span>
        <span className="font-medium text-[var(--fg)]">{formatINR(breakdown.base)}</span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-[var(--muted)]">Time Multiplier</span>
        <span className="font-medium text-[var(--fg)]">x{breakdown.time_mult.toFixed(2)}</span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-[var(--muted)]">Seat Multiplier</span>
        <span className="font-medium text-[var(--fg)]">x{breakdown.seat_mult.toFixed(2)}</span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-[var(--muted)]">Demand Multiplier</span>
        <span className="font-medium text-[var(--fg)]">x{breakdown.demand_mult.toFixed(2)}</span>
      </div>

      <div className="pt-3 border-t border-dashed border-[var(--border)] flex justify-between items-center">
        <span className="font-semibold text-[var(--fg)]">Final Price</span>
        <span className="font-bold text-[var(--primary)] text-lg">
          {formatINR(breakdown.clamped_price)}
        </span>
      </div>
    </div>
  );
}
