'use client';

import { useEffect, useState } from 'react';
import { pricingService } from '../lib/services/pricingService';
import { motion } from 'framer-motion';

interface DemandIndicatorProps {
    flightId: number;
    compact?: boolean;
}

export default function DemandIndicator({ flightId, compact = false }: DemandIndicatorProps) {
    const [demandScore, setDemandScore] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        pricingService.getDemandScore(flightId)
            .then(data => setDemandScore(data?.score ?? null))
            .finally(() => setLoading(false));
    }, [flightId]);

    if (loading) {
        return compact ? (
            <div className="w-16 h-4 bg-gray-200 animate-pulse rounded-full" />
        ) : (
            <div className="flex items-center gap-2">
                <div className="w-20 h-6 bg-gray-200 animate-pulse rounded-full" />
            </div>
        );
    }

    const score = demandScore ?? 0;
    const level = score < 0.3 ? 'Low' : score < 0.7 ? 'Medium' : 'High';
    const color = score < 0.3 ? 'green' : score < 0.7 ? 'yellow' : 'red';
    const bgColor = score < 0.3 ? 'bg-green-100' : score < 0.7 ? 'bg-yellow-100' : 'bg-red-100';
    const textColor = score < 0.3 ? 'text-green-700' : score < 0.7 ? 'text-yellow-700' : 'text-red-700';
    const borderColor = score < 0.3 ? 'border-green-300' : score < 0.7 ? 'border-yellow-300' : 'border-red-300';

    if (compact) {
        return (
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor} border ${borderColor}`}>
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`w-2 h-2 rounded-full ${color === 'green' ? 'bg-green-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}
                />
                <span>{level} Demand</span>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Demand Level</span>
                <span className={`text-sm font-bold ${textColor}`}>{level}</span>
            </div>

            {/* Demand meter */}
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${color === 'green' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                            color === 'yellow' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                />
            </div>

            {/* Score percentage */}
            <div className="flex items-center justify-between text-xs text-gray-500">
                <span>0%</span>
                <span className="font-medium">{(score * 100).toFixed(0)}%</span>
                <span>100%</span>
            </div>

            {/* Explanation */}
            <p className="text-xs text-gray-600 mt-2">
                {score < 0.3 && 'Low demand - Good time to book at lower prices'}
                {score >= 0.3 && score < 0.7 && 'Moderate demand - Prices may increase soon'}
                {score >= 0.7 && 'High demand - Book now before prices rise further'}
            </p>
        </div>
    );
}
