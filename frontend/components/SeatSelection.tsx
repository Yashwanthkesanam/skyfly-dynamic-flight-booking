// components/SeatSelection.tsx
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface SeatSelectionProps {
    totalSeats: number;
    onSeatsSelected: (seats: string[]) => void;
    maxSeats?: number;
}

export default function SeatSelection({ totalSeats, onSeatsSelected, maxSeats = 6 }: SeatSelectionProps) {
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

    // Generate seat layout (6 seats per row: A-F)
    const rows = Math.ceil(totalSeats / 6);
    const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    // Simulate some occupied seats
    const occupiedSeats = ['1A', '1B', '2C', '3D', '4E', '5F'];

    const toggleSeat = (seatId: string) => {
        if (occupiedSeats.includes(seatId)) return;

        if (selectedSeats.includes(seatId)) {
            const newSeats = selectedSeats.filter(s => s !== seatId);
            setSelectedSeats(newSeats);
            onSeatsSelected(newSeats);
        } else if (selectedSeats.length < maxSeats) {
            const newSeats = [...selectedSeats, seatId];
            setSelectedSeats(newSeats);
            onSeatsSelected(newSeats);
        }
    };

    const getSeatClass = (seatId: string) => {
        if (occupiedSeats.includes(seatId)) {
            return 'bg-gray-300 cursor-not-allowed';
        }
        if (selectedSeats.includes(seatId)) {
            return 'bg-blue-600 text-white border-blue-600';
        }
        return 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer';
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select Your Seats</h3>
                <p className="text-sm text-gray-600">
                    Selected: {selectedSeats.length} / {maxSeats} seats
                </p>
            </div>

            {/* Legend */}
            <div className="flex gap-6 mb-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 border-2 border-blue-600 rounded"></div>
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    <span>Occupied</span>
                </div>
            </div>

            {/* Seat Map */}
            <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-center mb-4 text-sm font-semibold text-gray-600">
                    ✈️ Front
                </div>

                <div className="space-y-2">
                    {Array.from({ length: Math.min(rows, 10) }).map((_, rowIndex) => (
                        <div key={rowIndex} className="flex items-center gap-2">
                            <span className="w-8 text-sm font-semibold text-gray-600">{rowIndex + 1}</span>

                            <div className="flex gap-2">
                                {seatLetters.slice(0, 3).map(letter => {
                                    const seatId = `${rowIndex + 1}${letter}`;
                                    return (
                                        <motion.button
                                            key={seatId}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => toggleSeat(seatId)}
                                            className={`w-10 h-10 border-2 rounded font-semibold text-sm transition-all ${getSeatClass(seatId)}`}
                                            disabled={occupiedSeats.includes(seatId)}
                                        >
                                            {letter}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <div className="w-8"></div>

                            <div className="flex gap-2">
                                {seatLetters.slice(3, 6).map(letter => {
                                    const seatId = `${rowIndex + 1}${letter}`;
                                    return (
                                        <motion.button
                                            key={seatId}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => toggleSeat(seatId)}
                                            className={`w-10 h-10 border-2 rounded font-semibold text-sm transition-all ${getSeatClass(seatId)}`}
                                            disabled={occupiedSeats.includes(seatId)}
                                        >
                                            {letter}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedSeats.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-semibold text-blue-900">
                        Selected Seats: {selectedSeats.join(', ')}
                    </p>
                </div>
            )}
        </div>
    );
}
