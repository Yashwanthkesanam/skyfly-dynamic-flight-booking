'use client';

import { useEffect, useState } from 'react';
import { pricingService, FareHistoryItem } from '../lib/services/pricingService';
import { motion } from 'framer-motion';

interface FareHistoryChartProps {
    flightId: number;
    currentPrice: number;
}

export default function FareHistoryChart({ flightId, currentPrice }: FareHistoryChartProps) {
    const [history, setHistory] = useState<FareHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        pricingService.getFareHistory(flightId, 10)
            .then(setHistory)
            .finally(() => setLoading(false));
    }, [flightId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No price history available yet</p>
            </div>
        );
    }

    const prices = history.map(h => h.new_price);
    const maxPrice = Math.max(...prices, currentPrice);
    const minPrice = Math.min(...prices, currentPrice);
    const priceRange = maxPrice - minPrice || 1;

    return (
        <div className="space-y-4">
            {/* Chart Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Price History</h3>
                <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">₹{currentPrice.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Current Price</div>
                </div>
            </div>

            {/* Simple Line Chart */}
            <div className="relative h-40 bg-gradient-to-b from-blue-50 to-white rounded-lg p-4 border border-gray-200">
                <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="400" y2="25" stroke="#e5e7eb" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="400" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
                    <line x1="0" y1="75" x2="400" y2="75" stroke="#e5e7eb" strokeWidth="0.5" />

                    {/* Price line */}
                    <polyline
                        points={history.map((h, i) => {
                            const x = (i / (history.length - 1 || 1)) * 400;
                            const y = 100 - ((h.new_price - minPrice) / priceRange) * 80 - 10;
                            return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="url(#priceGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="priceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                    </defs>

                    {/* Data points */}
                    {history.map((h, i) => {
                        const x = (i / (history.length - 1 || 1)) * 400;
                        const y = 100 - ((h.new_price - minPrice) / priceRange) * 80 - 10;
                        return (
                            <circle
                                key={h.id}
                                cx={x}
                                cy={y}
                                r="4"
                                fill="#3b82f6"
                                className="hover:r-6 transition-all cursor-pointer"
                            >
                                <title>₹{h.new_price.toFixed(2)} - {h.reason}</title>
                            </circle>
                        );
                    })}
                </svg>

                {/* Price range labels */}
                <div className="absolute top-2 left-2 text-xs text-gray-500">₹{maxPrice.toFixed(0)}</div>
                <div className="absolute bottom-2 left-2 text-xs text-gray-500">₹{minPrice.toFixed(0)}</div>
            </div>

            {/* Price change events */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.slice(0, 5).map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.old_price && item.new_price > item.old_price
                                    ? 'bg-red-500'
                                    : 'bg-green-500'
                                }`} />
                            <span className="text-gray-600 text-xs">{item.reason}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {item.old_price && (
                                <>
                                    <span className="text-gray-400 line-through text-xs">₹{item.old_price.toFixed(0)}</span>
                                    <span className="text-gray-400">→</span>
                                </>
                            )}
                            <span className="font-semibold text-gray-900">₹{item.new_price.toFixed(0)}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                    <div className="text-xs text-gray-500">Lowest</div>
                    <div className="text-lg font-bold text-green-600">₹{minPrice.toFixed(0)}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-500">Highest</div>
                    <div className="text-lg font-bold text-red-600">₹{maxPrice.toFixed(0)}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-500">Changes</div>
                    <div className="text-lg font-bold text-blue-600">{history.length}</div>
                </div>
            </div>
        </div>
    );
}
