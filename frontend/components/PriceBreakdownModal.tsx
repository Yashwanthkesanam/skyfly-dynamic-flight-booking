'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PriceBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    breakdown: {
        base: number;
        hours_to_departure?: number;
        time_mult: number;
        seat_mult: number;
        demand_mult: number;
        raw_price: number;
        clamped_price: number;
    };
}

export default function PriceBreakdownModal({ isOpen, onClose, breakdown }: PriceBreakdownModalProps) {
    if (!isOpen) return null;

    const factors = [
        {
            label: 'Base Fare',
            value: `₹${breakdown.base.toFixed(2)}`,
            description: 'Standard flight price',
            multiplier: null,
            color: 'blue'
        },
        {
            label: 'Time to Departure',
            value: breakdown.hours_to_departure ? `${breakdown.hours_to_departure.toFixed(1)}h` : 'N/A',
            description: 'Urgency pricing based on departure time',
            multiplier: breakdown.time_mult,
            color: 'purple'
        },
        {
            label: 'Seat Availability',
            value: `×${breakdown.seat_mult.toFixed(2)}`,
            description: 'Scarcity pricing based on remaining seats',
            multiplier: breakdown.seat_mult,
            color: 'orange'
        },
        {
            label: 'Demand Score',
            value: `×${breakdown.demand_mult.toFixed(2)}`,
            description: 'Route popularity and booking trends',
            multiplier: breakdown.demand_mult,
            color: 'green'
        }
    ];

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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={onClose}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                                <h2 className="text-xl font-bold text-gray-900">Dynamic Price Breakdown</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Factors */}
                                {factors.map((factor, index) => (
                                    <motion.div
                                        key={factor.label}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full bg-${factor.color}-500`} />
                                                <span className="font-medium text-gray-900">{factor.label}</span>
                                            </div>
                                            <span className="text-lg font-bold text-gray-900">{factor.value}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 ml-5">{factor.description}</p>
                                        {factor.multiplier && (
                                            <div className="ml-5 mt-2">
                                                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min((factor.multiplier - 1) * 100, 100)}%` }}
                                                        transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                                                        className={`h-full bg-${factor.color}-500 rounded-full`}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}

                                {/* Calculation */}
                                <div className="border-t border-gray-200 pt-4 space-y-3">
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <span>Raw Calculated Price</span>
                                        <span className="font-mono">₹{breakdown.raw_price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <span>Formula</span>
                                        <span className="font-mono text-xs">
                                            Base × Time × Seats × Demand
                                        </span>
                                    </div>
                                </div>

                                {/* Final Price */}
                                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-gray-600 mb-1">Final Price (Clamped)</div>
                                            <div className="text-xs text-gray-500">
                                                Capped between 60% - 300% of base fare
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-blue-600">
                                            ₹{breakdown.clamped_price.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-900">
                                        <strong>How it works:</strong> Our dynamic pricing algorithm adjusts fares in real-time based on multiple factors to ensure fair and competitive pricing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
