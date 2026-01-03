// components/PaymentGateway.tsx
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';
import { showSuccess, showError } from '../lib/utils/toast';

interface PaymentGatewayProps {
    amount: number;
    onSuccess: (paymentId: string) => void;
    onCancel: () => void;
}

export default function PaymentGateway({ amount, onSuccess, onCancel }: PaymentGatewayProps) {
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');

    const [cardData, setCardData] = useState({
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    });

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            const paymentId = `PAY${Date.now()}`;
            showSuccess('Payment successful!');
            onSuccess(paymentId);
        } catch (error) {
            showError('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto"
        >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Payment</h2>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">₹{amount.toFixed(2)}</span>
                </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { value: 'card', label: 'Card', icon: '💳' },
                        { value: 'upi', label: 'UPI', icon: '📱' },
                        { value: 'netbanking', label: 'Net Banking', icon: '🏦' }
                    ].map(method => (
                        <button
                            key={method.value}
                            type="button"
                            onClick={() => setPaymentMethod(method.value as any)}
                            className={`p-3 border-2 rounded-lg transition-all ${paymentMethod === method.value
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <div className="text-2xl mb-1">{method.icon}</div>
                            <div className="text-xs font-semibold">{method.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Card Payment Form */}
            {paymentMethod === 'card' && (
                <form onSubmit={handlePayment} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number</label>
                        <input
                            type="text"
                            value={cardData.number}
                            onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Cardholder Name</label>
                        <input
                            type="text"
                            value={cardData.name}
                            onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="JOHN DOE"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry</label>
                            <input
                                type="text"
                                value={cardData.expiry}
                                onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="MM/YY"
                                maxLength={5}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">CVV</label>
                            <input
                                type="password"
                                value={cardData.cvv}
                                onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="123"
                                maxLength={3}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner size="sm" color="white" />
                                    Processing...
                                </>
                            ) : (
                                `Pay ₹${amount.toFixed(2)}`
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* UPI/Net Banking - Simplified */}
            {(paymentMethod === 'upi' || paymentMethod === 'netbanking') && (
                <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">
                        {paymentMethod === 'upi' ? 'UPI payment integration coming soon' : 'Net banking integration coming soon'}
                    </p>
                    <button
                        onClick={() => setPaymentMethod('card')}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                        Use Card Payment Instead
                    </button>
                </div>
            )}

            <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 text-center">
                🔒 Secure payment powered by FlySmart
            </div>
        </motion.div>
    );
}
