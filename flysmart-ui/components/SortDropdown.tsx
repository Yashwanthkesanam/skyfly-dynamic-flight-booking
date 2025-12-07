// components/SortDropdown.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

export type SortOption = 'price-asc' | 'price-desc' | 'duration-asc' | 'departure-asc' | 'departure-desc';

interface SortDropdownProps {
    onSortChange: (sort: SortOption) => void;
    currentSort?: SortOption;
}

const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'duration-asc', label: 'Duration: Shortest First' },
    { value: 'departure-asc', label: 'Departure: Earliest First' },
    { value: 'departure-desc', label: 'Departure: Latest First' }
];

export default function SortDropdown({ onSortChange, currentSort = 'price-asc' }: SortDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLabel = sortOptions.find(opt => opt.value === currentSort)?.label || 'Sort By';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (value: SortOption) => {
        onSortChange(value);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg)] transition-colors font-medium text-[var(--fg)]"
            >
                <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span>{currentLabel}</span>
                <ChevronDownIcon className={`w-4 h-4 text-[var(--muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-50">
                    <div className="py-2">
                        {sortOptions.map(option => (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${currentSort === option.value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold' : 'text-[var(--fg)]'
                                    }`}
                            >
                                {option.label}
                                {currentSort === option.value && (
                                    <svg className="w-4 h-4 inline-block ml-2 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
