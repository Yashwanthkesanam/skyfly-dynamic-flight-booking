'use client';

import { motion } from 'framer-motion';

// Skeleton loader for flight cards
export function FlightCardSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-32 bg-gray-200 rounded" />
                <div className="h-8 w-24 bg-gray-200 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                    <div className="h-6 w-20 bg-gray-200 rounded" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-6 w-16 bg-gray-200 rounded" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                    <div className="h-6 w-20 bg-gray-200 rounded" />
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-10 w-32 bg-gray-200 rounded-lg" />
            </div>
        </div>
    );
}

// Spinner for buttons and actions
export function Spinner({ size = 'md', color = 'blue' }: { size?: 'sm' | 'md' | 'lg', color?: string }) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    };

    return (
        <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-${color}-600 ${sizes[size]}`} />
    );
}

// Loading overlay
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4"
            >
                <Spinner size="lg" />
                <p className="text-gray-700 font-medium">{message}</p>
            </motion.div>
        </div>
    );
}

// Progress bar for multi-step flows
export function ProgressBar({ current, total }: { current: number; total: number }) {
    const percentage = (current / total) * 100;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Step {current} of {total}</span>
                <span>{percentage.toFixed(0)}%</span>
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                />
            </div>
        </div>
    );
}

// Skeleton for search results
export function SearchResultsSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <FlightCardSkeleton key={i} />
            ))}
        </div>
    );
}

// Pulse animation for live updates
export function PulseIndicator({ label }: { label?: string }) {
    return (
        <div className="flex items-center gap-2">
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-2 h-2 rounded-full bg-green-500"
            />
            {label && <span className="text-xs text-gray-600">{label}</span>}
        </div>
    );
}
