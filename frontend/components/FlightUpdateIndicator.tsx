// components/FlightUpdateIndicator.tsx
"use client";

import { useEffect, useState } from 'react';

interface FlightUpdateIndicatorProps {
    type: 'price_drop' | 'seat_reduction';
    value: number;
    visible: boolean;
    onAnimationEnd?: () => void;
}

export default function FlightUpdateIndicator({
    type,
    value,
    visible,
    onAnimationEnd
}: FlightUpdateIndicatorProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (visible) {
            setShow(true);
            // Auto-hide after 3 seconds
            const timer = setTimeout(() => {
                setShow(false);
                onAnimationEnd?.();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible, onAnimationEnd]);

    if (!show) return null;

    const isPriceDrop = type === 'price_drop';

    return (
        <div
            className={`
        absolute top-2 right-2 z-10
        px-3 py-1.5 rounded-lg
        text-xs font-semibold
        shadow-lg
        animate-pulse-fade
        ${isPriceDrop
                    ? 'bg-green-500 text-white'
                    : 'bg-orange-500 text-white'
                }
      `}
            style={{
                animation: 'pulse-fade 3s ease-in-out'
            }}
        >
            {isPriceDrop ? (
                <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Price dropped to ₹{value.toLocaleString('en-IN')}!
                </span>
            ) : (
                <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Only {value} seats left!
                </span>
            )}
        </div>
    );
}
