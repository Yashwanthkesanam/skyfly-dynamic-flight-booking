'use client';

import { useEffect } from 'react';
import { API_BASE_URL } from '../lib/api';

/**
 * ServerWarmup Component
 * 
 * This component triggers a lightweight request to the backend '/health' endpoint
 * as soon as the application shuts. This helps "wake up" the Render server
 * (if it's on a free tier and sleeping) before the user actually performs a search.
 */
export default function ServerWarmup() {
    useEffect(() => {
        // Fire and forget - we don't need to handle the response
        fetch(`${API_BASE_URL}/health`, { mode: 'no-cors' })
            .then(() => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[ServerWarmup] Ping sent to backend');
                }
            })
            .catch((err) => {
                // Silent failure is fine here, we don't want to alarm the user
                // just because the background warm-up failed.
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[ServerWarmup] Ping failed', err);
                }
            });
    }, []);

    return null; // This component renders nothing
}
