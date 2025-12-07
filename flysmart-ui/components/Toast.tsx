'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export default function Toast({ message, type = 'info', duration = 5000, onClose, action }: ToastProps) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
        error: <XCircleIcon className="w-6 h-6 text-red-500" />,
        info: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
        warning: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
    };

    const colors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200',
        warning: 'bg-yellow-50 border-yellow-200'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${colors[type]} backdrop-blur-sm max-w-md`}
        >
            {icons[type]}
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{message}</p>
            </div>
            {action && (
                <button
                    onClick={action.onClick}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                    {action.label}
                </button>
            )}
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
            >
                <XCircleIcon className="w-5 h-5" />
            </button>
        </motion.div>
    );
}

// Toast Container Component
interface ToastContainerProps {
    toasts: Array<{ id: string; message: string; type?: ToastType; action?: { label: string; onClick: () => void } }>;
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <div className="fixed top-4 right-4 z-[100] space-y-2">
            <AnimatePresence>
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => onRemove(toast.id)}
                        action={toast.action}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
