import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    name: string;
    email: string;
    username?: string;
    profilePicture?: string;
    role: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPERADMIN';
    sellerProfile?: {
        city: string | null;
        state: string | null;
        country: string | null;
        address: string | null;
    } | null;
    subscription?: {
        status: string;
        plan: string;
    } | null;
    _count?: {
        listings: number;
    };
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    updateUser: (user: User) => void;
    refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: (user, token) => set({ user, token, isAuthenticated: true }),
            logout: () => set({ user: null, token: null, isAuthenticated: false }),
            updateUser: (user) => set({ user }),
            refreshUser: async () => {
                const { token } = get();
                if (!token) return;
                try {
                    // Cyclic dependency issue if we import api here? 
                    // api imports authStore to get token. 
                    // If we import api here, it might crash.
                    // Better to use fetch directly or pass api as arg? 
                    // Let's rely on component calling this with data, OR implement a simple fetch here.
                    // Actually, api.ts is safe if it just uses useAuthStore.getState().
                    // But prevent circular imports. 
                    // Use the environment variable or default to localhost
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
                    const res = await fetch(`${API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const user = await res.json();
                        set({ user });
                    }
                } catch (e) {
                    console.error('Failed to refresh user', e);
                }
            }
        }),
        {
            name: 'auth-storage',
        }
    )
);
