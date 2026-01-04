// FILE: components/PriceBreakdown.tsx
import { PriceBreakdown as PriceBreakdownType } from '../types';

interface PriceBreakdownProps {
  breakdown: PriceBreakdownType;
}

export default function PriceBreakdown({ breakdown }: PriceBreakdownProps) {
  // Helpers to format currency
  const formatINR = (val: number) =>
    val.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

  // Interpret Time Factor
  const getTimeInsight = (mult: number) => {
    if (mult > 1.4) return { text: "Urgent Booking (< 24h)", color: "text-red-400", badge: "bg-red-600 text-white", desc: "Prices surge significantly within 24 hours of departure." };
    if (mult > 1.1) return { text: "Last Minute (< 48h)", color: "text-orange-400", badge: "bg-orange-600 text-white", desc: "Booking within 48 hours incurs a premium." };
    return { text: "Standard Timing", color: "text-green-400", badge: "bg-green-600 text-white", desc: "Booking in advance secures the best time rates." };
  };

  // Interpret Seat Factor
  const getSeatInsight = (mult: number) => {
    if (mult > 1.2) return { text: "High Occupancy", color: "text-red-400", badge: "bg-red-600 text-white", desc: "Very few seats left. Scarcity pricing active." };
    if (mult > 1.05) return { text: "Filling Fast", color: "text-orange-400", badge: "bg-orange-600 text-white", desc: "Flight is becoming popular." };
    return { text: "Plenty of Seats", color: "text-green-400", badge: "bg-green-600 text-white", desc: "Low occupancy keeps prices steady." };
  };

  // Interpret Demand Factor
  const getDemandInsight = (mult: number) => {
    if (mult > 1.2) return { text: "High Demand", color: "text-red-400", badge: "bg-red-600 text-white", desc: "User search volume is very high for this route." };
    if (mult > 1.05) return { text: "Trending", color: "text-orange-400", badge: "bg-orange-600 text-white", desc: "Increased interest detected for this flight." };
    return { text: "Normal Demand", color: "text-green-400", badge: "bg-green-600 text-white", desc: "Standard search activity." };
  };

  const timeInsight = getTimeInsight(breakdown.time_mult);
  const seatInsight = getSeatInsight(breakdown.seat_mult);
  const demandInsight = getDemandInsight(breakdown.demand_mult);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200">
        <h4 className="font-bold mb-1">How Pricing Works</h4>
        <p>Our AI analyzes 3 key factors to determine the best price in real-time.</p>
      </div>

      <div className="space-y-4">
        {/* Base Price */}
        <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
          <div>
            <div className="font-medium text-[var(--fg)]">Base Fare</div>
            <div className="text-xs text-[var(--muted)]">Airline's standard ticket price</div>
          </div>
          <span className="font-medium text-[var(--fg)]">{formatINR(breakdown.base)}</span>
        </div>

        {/* Time Factor */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--fg)]">Time to Departure</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${timeInsight.badge}`}>
                x{breakdown.time_mult.toFixed(2)}
              </span>
            </div>
            <div className={`text-sm font-semibold mt-0.5 ${timeInsight.color}`}>{timeInsight.text}</div>
            <div className="text-xs text-[var(--muted)] dark:text-gray-300 max-w-[200px] leading-tight mt-1">{timeInsight.desc}</div>
          </div>
        </div>

        {/* Seat Factor */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--fg)]">Seat Availability</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${seatInsight.badge}`}>
                x{breakdown.seat_mult.toFixed(2)}
              </span>
            </div>
            <div className={`text-sm font-semibold mt-0.5 ${seatInsight.color}`}>{seatInsight.text}</div>
            <div className="text-xs text-[var(--muted)] dark:text-gray-300 max-w-[200px] leading-tight mt-1">{seatInsight.desc}</div>
          </div>
        </div>

        {/* Demand Factor */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--fg)]">Real-time Demand</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${demandInsight.badge}`}>
                x{breakdown.demand_mult.toFixed(2)}
              </span>
            </div>
            <div className={`text-sm font-semibold mt-0.5 ${demandInsight.color}`}>{demandInsight.text}</div>
            <div className="text-xs text-[var(--muted)] dark:text-gray-300 max-w-[200px] leading-tight mt-1">{demandInsight.desc}</div>
          </div>
        </div>
      </div>

      {/* Final Calculation */}
      <div className="pt-4 border-t-2 border-dashed border-[var(--border)]">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-[var(--muted)]">Raw Calculation</span>
          <span className="text-sm text-[var(--muted)] line-through">
            {formatINR(breakdown.base * breakdown.time_mult * breakdown.seat_mult * breakdown.demand_mult)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <span className="font-bold text-lg text-[var(--fg)]">Final Dynamic Price</span>
            <div className="text-xs text-[var(--muted)]">(Smart Cap Applied)</div>
          </div>
          <span className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
            {formatINR(breakdown.clamped_price)}
          </span>
        </div>
      </div>
    </div>
  );
}
