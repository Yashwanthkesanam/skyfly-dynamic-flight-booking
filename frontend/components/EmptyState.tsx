'use client';

import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, TicketIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
    type: 'no-flights' | 'no-bookings' | 'search-start' | 'error';
    title?: string;
    message?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export default function EmptyState({ type, title, message, action }: EmptyStateProps) {
    const configs = {
        'no-flights': {
            icon: <MagnifyingGlassIcon className="w-16 h-16 text-gray-400" />,
            defaultTitle: 'No Flights Found',
            defaultMessage: 'Try adjusting your search criteria or selecting different dates',
            emoji: '✈️'
        },
        'no-bookings': {
            icon: <TicketIcon className="w-16 h-16 text-gray-400" />,
            defaultTitle: 'No Bookings Yet',
            defaultMessage: 'Start by searching for flights and making your first booking',
            emoji: '🎫'
        },
        'search-start': {
            icon: <MagnifyingGlassIcon className="w-16 h-16 text-gray-400" />,
            defaultTitle: 'Search to Get Started',
            defaultMessage: 'Enter your travel details above to find available flights',
            emoji: '🔍'
        },
        'error': {
            icon: <ExclamationCircleIcon className="w-16 h-16 text-red-400" />,
            defaultTitle: 'Something Went Wrong',
            defaultMessage: 'Please try again or contact support if the problem persists',
            emoji: '⚠️'
        }
    };

    const config = configs[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4"
        >
            {/* Icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className="mb-6"
            >
                {config.icon}
            </motion.div>

            {/* Emoji */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-6xl mb-4"
            >
                {config.emoji}
            </motion.div>

            {/* Title */}
            <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-gray-900 mb-2 text-center"
            >
                {title || config.defaultTitle}
            </motion.h3>

            {/* Message */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 text-center max-w-md mb-6"
            >
                {message || config.defaultMessage}
            </motion.p>

            {/* Action Button */}
            {action && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={action.onClick}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                    {action.label}
                </motion.button>
            )}
        </motion.div>
    );
}
