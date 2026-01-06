// hooks/useWebSocket.ts
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

export interface FlightUpdate {
    type: 'flight_update' | 'connection_established';
    flight_id?: number;
    flight_number?: string;
    price?: number;
    seats?: number;
    timestamp?: string;
    message?: string;
}

interface UseWebSocketReturn {
    isConnected: boolean;
    lastMessage: FlightUpdate | null;
    error: Error | null;
    reconnect: () => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://flysmart-backend-448p.onrender.com/ws/feeds';

if (!WS_URL) {
    if (typeof window !== 'undefined') console.warn('WebSocket URL is not defined. Real-time updates will be disabled.');
}
const RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

export function useWebSocket(): UseWebSocketReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<FlightUpdate | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectDelayRef = useRef(RECONNECT_DELAY);
    const shouldConnectRef = useRef(true);

    const connect = useCallback(() => {
        if (!shouldConnectRef.current) return;

        try {
            // Close existing connection if any
            if (wsRef.current) {
                wsRef.current.close();
            }

            if (!WS_URL) return;
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[WebSocket] Connected to real-time updates');
                setIsConnected(true);
                setError(null);
                reconnectDelayRef.current = RECONNECT_DELAY; // Reset delay on successful connection
            };

            ws.onmessage = (event) => {
                try {
                    const data: FlightUpdate = JSON.parse(event.data);
                    setLastMessage(data);

                    if (data.type === 'connection_established') {
                        console.log('[WebSocket] Connection confirmed:', data.message);
                    } else if (data.type === 'flight_update') {
                        console.log('[WebSocket] Flight update received:', data);
                    }
                } catch (err) {
                    console.error('[WebSocket] Failed to parse message:', err);
                }
            };

            ws.onerror = (event) => {
                const errorMsg = 'WebSocket connection error - Backend may not be running';
                // Use warning instead of error to reduce console noise
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[WebSocket] Connection failed. Start backend server for real-time updates.');
                } else {
                    console.error('[WebSocket] Error:', errorMsg);
                }
                setError(new Error(errorMsg));
            };

            ws.onclose = (event) => {
                console.log('[WebSocket] Disconnected:', event.code, event.reason);
                setIsConnected(false);
                wsRef.current = null;

                // Auto-reconnect with exponential backoff
                if (shouldConnectRef.current) {
                    const delay = reconnectDelayRef.current;
                    console.log(`[WebSocket] Reconnecting in ${delay}ms...`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectDelayRef.current = Math.min(
                            reconnectDelayRef.current * 1.5,
                            MAX_RECONNECT_DELAY
                        );
                        connect();
                    }, delay);
                }
            };

        } catch (err) {
            console.error('[WebSocket] Connection failed:', err);
            setError(err as Error);
        }
    }, []);

    const reconnect = useCallback(() => {
        reconnectDelayRef.current = RECONNECT_DELAY;
        connect();
    }, [connect]);

    useEffect(() => {
        shouldConnectRef.current = true;
        connect();

        // Cleanup on unmount
        return () => {
            shouldConnectRef.current = false;

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }

            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [connect]);

    return {
        isConnected,
        lastMessage,
        error,
        reconnect,
    };
}
