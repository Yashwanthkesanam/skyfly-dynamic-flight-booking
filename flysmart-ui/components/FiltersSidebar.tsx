// FILE: components/FiltersSidebar.tsx
'use client';

interface FilterState {
  minPrice: number;
  maxPrice: number;
  stops: string[];
  airlines: string[];
}

interface FiltersSidebarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

export default function FiltersSidebar({ filters, onChange }: FiltersSidebarProps) {

  const handleAirlineToggle = (airline: string) => {
    const newAirlines = filters.airlines.includes(airline)
      ? filters.airlines.filter(a => a !== airline)
      : [...filters.airlines, airline];
    onChange({ ...filters, airlines: newAirlines });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-6">
      <h2 className="font-bold text-lg text-gray-900">Filters</h2>

      {/* Price Range - Visual placeholder for now */}
      <div>
        <h3 className="text-sm font-semibold mb-3">One Way Price</h3>
        <div className="space-y-2">
          <input
            type="range"
            min="2000"
            max="20000"
            value={filters.maxPrice}
            onChange={(e) => onChange({ ...filters, maxPrice: parseInt(e.target.value) })}
            className="w-full accent-[var(--primary)]"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>₹{filters.minPrice}</span>
            <span>₹{filters.maxPrice}</span>
          </div>
        </div>
      </div>

      {/* Airlines */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Airlines</h3>
        <div className="space-y-2">
          {['IndiGo', 'Air India', 'Vistara', 'Akasa Air', 'SpiceJet', 'Air India Express'].map(airline => (
            <label key={airline} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.airlines.includes(airline)}
                onChange={() => handleAirlineToggle(airline)}
                className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span>{airline}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={() => onChange({ minPrice: 0, maxPrice: 20000, stops: [], airlines: [] })}
        className="text-sm text-[var(--primary)] font-medium hover:underline"
      >
        Clear All
      </button>
    </div>
  );
}
