// components/MobileFilterModal.tsx
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FilterPanel, { FilterState } from './FilterPanel';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface MobileFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    airlines: string[];
    minPrice: number;
    maxPrice: number;
    onFilterChange: (filters: FilterState) => void;
    currentFilters: FilterState;
}

export default function MobileFilterModal({
    isOpen,
    onClose,
    airlines,
    minPrice,
    maxPrice,
    onFilterChange,
    currentFilters
}: MobileFilterModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'tween', duration: 0.3 }}
                        className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 overflow-y-auto md:hidden"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>

                        {/* Filter Content */}
                        <div className="p-4">
                            <FilterPanel
                                airlines={airlines}
                                minPrice={minPrice}
                                maxPrice={maxPrice}
                                onFilterChange={(filters) => {
                                    onFilterChange(filters);
                                }}
                            />
                        </div>

                        {/* Apply Button */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
