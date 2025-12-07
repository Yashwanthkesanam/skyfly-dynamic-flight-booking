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
        <span className="text-gray-500">Base Fare</span>
        <span className="font-medium text-gray-900">{formatINR(breakdown.base)}</span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">Time Multiplier</span>
        <span className="font-medium text-gray-900">x{breakdown.time_mult.toFixed(2)}</span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">Seat Multiplier</span>
        <span className="font-medium text-gray-900">x{breakdown.seat_mult.toFixed(2)}</span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">Demand Multiplier</span>
        <span className="font-medium text-gray-900">x{breakdown.demand_mult.toFixed(2)}</span>
      </div>

      <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
        <span className="font-semibold text-gray-900">Final Price</span>
        <span className="font-bold text-[var(--primary)] text-lg">
          {formatINR(breakdown.clamped_price)}
        </span>
      </div>
    </div>
  );
}
