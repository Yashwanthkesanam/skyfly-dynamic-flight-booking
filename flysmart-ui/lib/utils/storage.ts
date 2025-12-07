export const PNR_STORAGE_KEY = 'flysmart_my_bookings';

export interface StoredBooking {
    pnr: string;
    createdAt: number;
}

export const savePNR = (pnr: string) => {
    if (typeof window === 'undefined') return;

    try {
        const stored = getStoredPNRs();
        if (!stored.includes(pnr)) {
            const newStored = [pnr, ...stored];
            localStorage.setItem(PNR_STORAGE_KEY, JSON.stringify(newStored));
        }
    } catch (error) {
        console.error('Failed to save PNR:', error);
    }
};

export const getStoredPNRs = (): string[] => {
    if (typeof window === 'undefined') return [];

    try {
        const item = localStorage.getItem(PNR_STORAGE_KEY);
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.error('Failed to load PNRs:', error);
        return [];
    }
};

export const clearStoredPNRs = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PNR_STORAGE_KEY);
};
