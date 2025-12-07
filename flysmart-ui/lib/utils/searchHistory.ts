// lib/utils/searchHistory.ts
interface SearchHistoryItem {
    id: string;
    origin: string;
    destination: string;
    date: string;
    travellers: number;
    timestamp: number;
}

const STORAGE_KEY = 'flysmart_search_history';
const MAX_HISTORY = 10;

export const searchHistory = {
    add: (search: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => {
        const history = searchHistory.getAll();
        const newItem: SearchHistoryItem = {
            ...search,
            id: Date.now().toString(),
            timestamp: Date.now()
        };

        // Remove duplicates
        const filtered = history.filter(
            item => !(item.origin === search.origin &&
                item.destination === search.destination &&
                item.date === search.date)
        );

        const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },

    getAll: (): SearchHistoryItem[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    },

    remove: (id: string) => {
        const history = searchHistory.getAll();
        const updated = history.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },

    clear: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
