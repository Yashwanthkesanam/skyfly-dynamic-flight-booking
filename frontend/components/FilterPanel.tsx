// components/FilterPanel.tsx
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

interface FilterPanelProps {
    airlines: string[];
    minPrice: number;
    maxPrice: number;
    onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
    priceRange: [number, number];
    selectedAirlines: string[];
    departureTime: string[];
}

export default function FilterPanel({ airlines, minPrice, maxPrice, onFilterChange }: FilterPanelProps) {
    const [filters, setFilters] = useState<FilterState>({
        priceRange: [minPrice, maxPrice],
        selectedAirlines: [],
        departureTime: []
    });

    const [expandedSections, setExpandedSections] = useState({
        price: true,
        airlines: true,
        time: true
    });

    const timeSlots = [
        { label: 'Morning', value: 'morning', time: '6AM - 12PM' },
        { label: 'Afternoon', value: 'afternoon', time: '12PM - 6PM' },
        { label: 'Evening', value: 'evening', time: '6PM - 12AM' },
        { label: 'Night', value: 'night', time: '12AM - 6AM' }
    ];

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handlePriceChange = (value: number, index: 0 | 1) => {
        const newRange: [number, number] = [...filters.priceRange] as [number, number];
        newRange[index] = value;
        const newFilters = { ...filters, priceRange: newRange };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleAirlineToggle = (airline: string) => {
        const newAirlines = filters.selectedAirlines.includes(airline)
            ? filters.selectedAirlines.filter(a => a !== airline)
            : [...filters.selectedAirlines, airline];
        const newFilters = { ...filters, selectedAirlines: newAirlines };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleTimeToggle = (timeSlot: string) => {
        const newTimes = filters.departureTime.includes(timeSlot)
            ? filters.departureTime.filter(t => t !== timeSlot)
            : [...filters.departureTime, timeSlot];
        const newFilters = { ...filters, departureTime: newTimes };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleClearAll = () => {
        const clearedFilters: FilterState = {
            priceRange: [minPrice, maxPrice],
            selectedAirlines: [],
            departureTime: []
        };
        setFilters(clearedFilters);
        onFilterChange(clearedFilters);
    };

    const activeFilterCount =
        filters.selectedAirlines.length +
        filters.departureTime.length +
        (filters.priceRange[0] !== minPrice || filters.priceRange[1] !== maxPrice ? 1 : 0);

    return (
        <div className="bg-[var(--surface)] rounded-lg shadow-lg p-6 sticky top-4 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[var(--fg)]">Filters</h3>
                {activeFilterCount > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                    >
                        Clear All ({activeFilterCount})
                    </button>
                )}
            </div>

            {/* Price Range Filter */}
            <div className="mb-6 border-b border-[var(--border)] pb-6">
                <button
                    onClick={() => toggleSection('price')}
                    className="flex items-center justify-between w-full mb-4"
                >
                    <span className="font-semibold text-[var(--fg)]">Price Range</span>
                    {expandedSections.price ? (
                        <ChevronUpIcon className="w-5 h-5 text-[var(--muted)]" />
                    ) : (
                        <ChevronDownIcon className="w-5 h-5 text-[var(--muted)]" />
                    )}
                </button>

                <AnimatePresence>
                    {expandedSections.price && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <label className="text-xs text-[var(--muted)] block mb-1">Min</label>
                                    <input
                                        type="number"
                                        value={filters.priceRange[0]}
                                        onChange={(e) => handlePriceChange(Number(e.target.value), 0)}
                                        className="w-full px-3 py-2 border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]"
                                        min={minPrice}
                                        max={filters.priceRange[1]}
                                    />
                                </div>
                                <span className="text-[var(--muted)] mt-5">-</span>
                                <div className="flex-1">
                                    <label className="text-xs text-[var(--muted)] block mb-1">Max</label>
                                    <input
                                        type="number"
                                        value={filters.priceRange[1]}
                                        onChange={(e) => handlePriceChange(Number(e.target.value), 1)}
                                        className="w-full px-3 py-2 border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]"
                                        min={filters.priceRange[0]}
                                        max={maxPrice}
                                    />
                                </div>
                            </div>
                            <input
                                type="range"
                                min={minPrice}
                                max={maxPrice}
                                value={filters.priceRange[1]}
                                onChange={(e) => handlePriceChange(Number(e.target.value), 1)}
                                className="w-full accent-[var(--primary)]"
                            />
                            <div className="flex justify-between text-xs text-[var(--muted)]">
                                <span>₹{minPrice}</span>
                                <span>₹{maxPrice}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Airlines Filter */}
            <div className="mb-6 border-b border-[var(--border)] pb-6">
                <button
                    onClick={() => toggleSection('airlines')}
                    className="flex items-center justify-between w-full mb-4"
                >
                    <span className="font-semibold text-[var(--fg)]">Airlines</span>
                    {expandedSections.airlines ? (
                        <ChevronUpIcon className="w-5 h-5 text-[var(--muted)]" />
                    ) : (
                        <ChevronDownIcon className="w-5 h-5 text-[var(--muted)]" />
                    )}
                </button>

                <AnimatePresence>
                    {expandedSections.airlines && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-3"
                        >
                            {airlines.map(airline => (
                                <label key={airline} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={filters.selectedAirlines.includes(airline)}
                                        onChange={() => handleAirlineToggle(airline)}
                                        className="w-4 h-4 text-blue-600 border-[var(--border)] rounded focus:ring-blue-500 bg-[var(--bg)]"
                                    />
                                    <span className="text-sm text-[var(--fg)] group-hover:text-[var(--primary)] transition-colors">{airline}</span>
                                </label>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Departure Time Filter */}
            <div>
                <button
                    onClick={() => toggleSection('time')}
                    className="flex items-center justify-between w-full mb-4"
                >
                    <span className="font-semibold text-[var(--fg)]">Departure Time</span>
                    {expandedSections.time ? (
                        <ChevronUpIcon className="w-5 h-5 text-[var(--muted)]" />
                    ) : (
                        <ChevronDownIcon className="w-5 h-5 text-[var(--muted)]" />
                    )}
                </button>

                <AnimatePresence>
                    {expandedSections.time && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-2"
                        >
                            {timeSlots.map(slot => (
                                <button
                                    key={slot.value}
                                    onClick={() => handleTimeToggle(slot.value)}
                                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${filters.departureTime.includes(slot.value)
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'border-[var(--border)] hover:border-[var(--muted)] text-[var(--fg)] hover:bg-[var(--bg)]'
                                        }`}
                                >
                                    <div className="font-semibold text-sm">{slot.label}</div>
                                    <div className="text-xs opacity-75">{slot.time}</div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
