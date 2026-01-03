// lib/auth/authContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check for stored user on mount
        const storedUser = localStorage.getItem('flysmart_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async (email: string, password: string) => {
        // Simulate API call - replace with actual API
        const mockUser = {
            id: '1',
            email,
            name: email.split('@')[0]
        };
        setUser(mockUser);
        localStorage.setItem('flysmart_user', JSON.stringify(mockUser));
    };

    const signup = async (name: string, email: string, password: string) => {
        // Simulate API call - replace with actual API
        const mockUser = {
            id: Date.now().toString(),
            email,
            name
        };
        setUser(mockUser);
        localStorage.setItem('flysmart_user', JSON.stringify(mockUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('flysmart_user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            signup,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
