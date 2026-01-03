// components/SearchForm.tsx
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import debounce from "lodash/debounce";
import { format, isSameDay } from "date-fns";

import { flightService } from "../lib/services/flightService";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/solid";

export default function SearchForm() {
  const router = useRouter();
  // Trip Type is now hardcoded to 'oneway'
  const [tripType, setTripType] = useState<"oneway" | "roundtrip" | "multicity">("oneway");
  const [from, setFrom] = useState("Delhi");
  const [to, setTo] = useState("Bengaluru");
  const [departDate, setDepartDate] = useState<Date | null>(new Date());
  const [returnDate, setReturnDate] = useState<Date | null>(new Date(new Date().setDate(new Date().getDate() + 1)));

  // Suggestions State
  const [suggestFrom, setSuggestFrom] = useState<any[]>([]);
  const [suggestTo, setSuggestTo] = useState<any[]>([]);
  const [showFromSuggest, setShowFromSuggest] = useState(false);
  const [showToSuggest, setShowToSuggest] = useState(false);

  // Travelers
  const [travellers, setTravellers] = useState({ count: 1 });
  const [showTravellerPopover, setShowTravellerPopover] = useState(false);

  // Validation
  const [sameCityError, setSameCityError] = useState(false);

  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  // -------------------------
  // Suggestion Logic
  // -------------------------
  const fetchSuggestions = useMemo(
    () =>
      debounce(async (q: string, setter: (s: any[]) => void, excludeCity?: string) => {
        if (!q || q.length < 2) return;

        try {
          const suggestions = await flightService.getSuggestions(q);
          // Filter out the excluded city (opposite selection)
          const filtered = excludeCity
            ? suggestions.filter((s: any) => s.city.toLowerCase() !== excludeCity.toLowerCase())
            : suggestions;
          setter(filtered);
        } catch {
          setter([]);
        }
      }, 300),
    []
  );

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrom(e.target.value);
    setShowFromSuggest(true);
    setSameCityError(false); // Clear error when typing
    fetchSuggestions(e.target.value, setSuggestFrom, to); // Exclude 'to' city
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTo(e.target.value);
    setShowToSuggest(true);
    setSameCityError(false); // Clear error when typing
    fetchSuggestions(e.target.value, setSuggestTo, from); // Exclude 'from' city
  };

  const selectFrom = (item: any) => {
    setFrom(item.city);
    setShowFromSuggest(false);
    // Check if same as destination
    if (item.city.toLowerCase() === to.toLowerCase()) {
      setSameCityError(true);
    } else {
      setSameCityError(false);
    }
  };

  const selectTo = (item: any) => {
    setTo(item.city);
    setShowToSuggest(false);
    // Check if same as origin
    if (item.city.toLowerCase() === from.toLowerCase()) {
      setSameCityError(true);
    } else {
      setSameCityError(false);
    }
  };

  // -------------------------
  // Submit
  // -------------------------
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validate same city
    if (from.toLowerCase() === to.toLowerCase()) {
      setSameCityError(true);
      return;
    }
    setSameCityError(false);

    const params: Record<string, string> = {
      origin: from,
      destination: to,
      date: departDate ? format(departDate, "yyyy-MM-dd") : "",
      travellers: travellers.count.toString(),
    };

    if (returnDate && tripType === "roundtrip") {
      params.return_date = format(returnDate, "yyyy-MM-dd");
    }

    const query = new URLSearchParams(params);
    router.push(`/results?${query.toString()}`);
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="w-full max-w-6xl mx-auto bg-[var(--surface)] rounded-lg shadow-xl p-6 relative z-50 search-card transition-colors">
      <form id="flysmart-search-form" onSubmit={handleSearch}>

        {/* Top: Trip Type & Text */}
        {/* Top: Trip Type & Text */}
        {/* Top: Trip Type & Text */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center space-x-6 text-sm font-medium text-[var(--muted)]">
            <label className="flex items-center space-x-2 cursor-pointer hover:text-[var(--primary)] transition-colors">
              <input
                type="radio"
                name="tripType"
                checked={tripType === 'oneway'}
                onChange={() => setTripType('oneway')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className={tripType === 'oneway' ? "text-[var(--fg)] font-bold" : ""}>One Way</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="tripType"
                checked={tripType === 'roundtrip'}
                onChange={() => setTripType('roundtrip')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className={tripType === 'roundtrip' ? "text-gray-900 font-bold" : ""}>Round Trip</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="tripType"
                checked={tripType === 'multicity'}
                onChange={() => setTripType('multicity')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className={tripType === 'multicity' ? "text-gray-900 font-bold" : ""}>Multi City</span>
            </label>
          </div>
          <div className="text-xs text-gray-500 hidden md:block">
            Book International and Domestic Flights
          </div>
        </div>

        {/* Main Input Grid - Single Row with Dividers */}
        <div className="grid grid-cols-12 border border-[var(--border)] rounded-lg divide-x divide-[var(--border)] min-h-[110px]">

          {/* FROM */}
          <div className="col-span-12 md:col-span-3 px-5 py-3 relative hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group cursor-pointer" onClick={() => fromRef.current?.focus()}>
            <span className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">From</span>
            <input
              ref={fromRef}
              value={from}
              onChange={handleFromChange}
              onFocus={() => setShowFromSuggest(true)}
              className="w-full text-3xl font-black text-[var(--fg)] bg-transparent outline-none mt-1 truncate placeholder:text-[var(--muted)]"
              suppressHydrationWarning
            />
            <span className="block text-xs text-[var(--muted)] mt-1 truncate">DEL, Delhi Airport India</span>

            {/* Suggestions One */}
            {showFromSuggest && suggestFrom.length > 0 && (
              <div className="absolute top-full left-0 w-[350px] bg-[var(--surface)] shadow-2xl rounded-lg z-[999] border border-[var(--border)] mt-2">
                {suggestFrom.map((item, idx) => (
                  <div key={idx} onClick={(e) => { e.stopPropagation(); selectFrom(item); }} className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer flex justify-between border-b last:border-0 border-[var(--border)]">
                    <div>
                      <div className="font-bold text-[var(--fg)]">{item.city}</div>
                      <div className="text-xs text-[var(--muted)]">{item.airport}</div>
                    </div>
                    <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-[var(--fg)] px-1 rounded h-fit">{item.code}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TO */}
          <div className="col-span-12 md:col-span-3 px-5 py-3 relative hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group cursor-pointer" onClick={() => toRef.current?.focus()}>
            <span className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">To</span>
            <input
              ref={toRef}
              value={to}
              onChange={handleToChange}
              onFocus={() => setShowToSuggest(true)}
              className="w-full text-3xl font-black text-[var(--fg)] bg-transparent outline-none mt-1 truncate placeholder:text-[var(--muted)]"
              suppressHydrationWarning
            />
            <span className="block text-xs text-[var(--muted)] mt-1 truncate">BLR, Bengaluru International Airport</span>

            {/* Swap Icon */}
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--surface)] shadow-md border border-[var(--border)] flex items-center justify-center text-blue-600 z-10 cursor-pointer hover:scale-110 transition-transform" onClick={() => {
              const temp = from; setFrom(to); setTo(temp);
            }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>

            {/* Suggestions Two */}
            {showToSuggest && suggestTo.length > 0 && (
              <div className="absolute top-full left-0 w-[350px] bg-[var(--surface)] shadow-2xl rounded-lg z-[999] border border-[var(--border)] mt-2">
                {suggestTo.map((item, idx) => (
                  <div key={idx} onClick={(e) => { e.stopPropagation(); selectTo(item); }} className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer flex justify-between border-b last:border-0 border-[var(--border)]">
                    <div>
                      <div className="font-bold text-[var(--fg)]">{item.city}</div>
                      <div className="text-xs text-[var(--muted)]">{item.airport}</div>
                    </div>
                    <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-[var(--fg)] px-1 rounded h-fit">{item.code}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DEPARTURE */}
          <div className="col-span-6 md:col-span-2 px-5 py-3 relative hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group">
            <label className="flex items-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wide gap-1 cursor-pointer">
              Departure
              <ChevronDownIcon className="w-3 h-3 text-blue-500" />
            </label>
            <div className="mt-1">
              <DatePicker
                selected={departDate}
                onChange={setDepartDate}
                dateFormat="d MMM''yy"
                className="w-full bg-transparent text-3xl font-black text-[var(--fg)] outline-none cursor-pointer p-0 placeholder:text-[var(--muted)]"
                placeholderText="Select Date"
                minDate={new Date()}
                monthsShown={2}
                popperProps={{ strategy: 'fixed' }}
                showPopperArrow={false}
                calendarClassName="font-sans border-0 shadow-2xl rounded-xl"
                popperClassName="z-[9999] mt-4"
                dayClassName={() => "rounded-lg hover:bg-blue-50 font-bold text-gray-700"}
                renderDayContents={(day, date) => {
                  const isSelected = departDate && date ? isSameDay(date, departDate) : false;
                  return (
                    <div className="relative z-10">{day}</div>
                  );
                }}
                wrapperClassName="suppress-hydration"
              />
              <span className="block text-xs text-[var(--muted)] mt-1">
                {departDate ? format(departDate, "EEEE") : "Select Day"}
              </span>
            </div>
          </div>

          {/* RETURN */}
          <div className="col-span-6 md:col-span-2 px-5 py-3 relative hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group border-r-0 md:border-r border-[var(--border)]">
            <label className="flex items-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wide gap-1 cursor-pointer">
              Return
              <ChevronDownIcon className="w-3 h-3 text-blue-500" />
            </label>
            <div className="mt-1">
              {tripType === 'oneway' ? (
                <div onClick={() => setTripType('roundtrip')} className="h-full flex flex-col justify-center">
                  <span className="text-sm font-bold text-[var(--muted)]">Tap to add a return date for bigger discounts</span>
                </div>
              ) : (
                <>
                  <DatePicker
                    selected={returnDate}
                    onChange={setReturnDate}
                    dateFormat="d MMM''yy"
                    className="w-full bg-transparent text-3xl font-black text-[var(--fg)] outline-none cursor-pointer p-0 placeholder:text-[var(--muted)]"
                    placeholderText="Select Date"
                    minDate={departDate || new Date()}
                    monthsShown={2}
                    popperProps={{ strategy: 'fixed' }}
                    showPopperArrow={false}
                    calendarClassName="font-sans border-0 shadow-2xl rounded-xl"
                    popperClassName="z-[9999] mt-4"
                    dayClassName={() => "rounded-lg hover:bg-blue-50 font-bold text-gray-700"}
                    renderDayContents={(day, date) => {
                      const isSelected = returnDate && date ? isSameDay(date, returnDate) : false;
                      return (
                        <div className="relative z-10">{day}</div>
                      );
                    }}
                    wrapperClassName="suppress-hydration"
                  />
                  <div className="flex items-center justify-between w-full">
                    <span className="block text-xs text-[var(--muted)] mt-1">
                      {returnDate ? format(returnDate, "EEEE") : "Select Day"}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); setTripType('oneway'); setReturnDate(null); }} className="text-[var(--muted)] hover:text-red-500">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* TRAVELLERS & CLASS */}
          <div className="col-span-12 md:col-span-2 px-5 py-3 relative hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer" onClick={() => setShowTravellerPopover(!showTravellerPopover)}>
            <label className="flex items-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wide gap-1 cursor-pointer">
              Travellers
              <ChevronDownIcon className="w-3 h-3 text-blue-500" />
            </label>
            <div className="mt-1">
              <div className="text-3xl font-black text-[var(--fg)]">
                {travellers.count} <span className="text-xl font-bold">Traveller</span>
              </div>
              <div className="text-xs text-[var(--muted)] mt-1 truncate">Selection</div>
            </div>

            {/* Popover */}
            {showTravellerPopover && (
              <div className="absolute top-full right-0 w-[400px] bg-[var(--surface)] shadow-2xl rounded-xl z-[999] p-6 cursor-default border border-[var(--border)] mt-2" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-[var(--fg)] mb-4">Travellers</h3>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm font-semibold text-[var(--fg)]">Adults <span className="block text-xs font-normal text-[var(--muted)]">(12y+)</span></div>
                  <div className="flex items-center gap-3 text-[var(--fg)]">
                    <button type="button" className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center font-bold" onClick={() => setTravellers(t => ({ ...t, count: Math.max(1, t.count - 1) }))}>-</button>
                    <span>{travellers.count}</span>
                    <button type="button" className="w-8 h-8 rounded-full border border-blue-500 text-blue-500 flex items-center justify-center font-bold" onClick={() => setTravellers(t => ({ ...t, count: t.count + 1 }))}>+</button>
                  </div>
                </div>

                <button onClick={() => setShowTravellerPopover(false)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg uppercase tracking-wide text-sm">
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>




        {/* Submit handle is external via ref id */}
        <button type="submit" className="hidden">Submit</button>
      </form>
    </div>
  );
}
