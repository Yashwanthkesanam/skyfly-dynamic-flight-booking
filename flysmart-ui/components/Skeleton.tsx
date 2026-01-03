// components/Skeleton.tsx
export function FlightCardSkeleton() {
    return (
        <div className="bg-[var(--surface)] p-5 mb-4 rounded-xl border border-[var(--border)] animate-pulse">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Airline Info Skeleton */}
                <div className="flex-shrink-0 w-full md:w-24 flex flex-col items-center md:items-start">
                    <div className="h-12 w-12 bg-gray-300 dark:bg-gray-700 rounded-full mb-2"></div>
                    <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded mt-1"></div>
                </div>

                {/* Flight Timing Skeleton */}
                <div className="flex-grow flex items-center justify-between w-full md:max-w-md">
                    <div className="text-center">
                        <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    </div>

                    <div className="flex-grow px-4 flex flex-col items-center">
                        <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="w-full h-[2px] bg-gray-300 dark:bg-gray-700"></div>
                        <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded mt-2"></div>
                    </div>

                    <div className="text-center">
                        <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>

                {/* Price & Action Skeleton */}
                <div className="flex-shrink-0 w-full md:w-56 flex flex-col items-end gap-3">
                    <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    <div className="h-12 w-full bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                </div>
            </div>

            {/* Additional Info Skeleton */}
            <div className="flex items-center gap-4 pt-4 mt-4 border-t border-[var(--border)]">
                <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded ml-auto"></div>
            </div>
        </div>
    );
}

export function BookingCardSkeleton() {
    return (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 w-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>

            <div className="flex gap-2 mt-4">
                <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            </div>
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <tr className="animate-pulse">
            <td className="px-4 py-3">
                <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </td>
        </tr>
    );
}
