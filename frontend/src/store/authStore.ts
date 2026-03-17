import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    name: string;
    email: string;
    username?: string;
    profilePicture?: string;
    role: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPERADMIN';
    district?: string;
    state?: string;
    country?: string;
    sellerProfile?: {
        city: string | null;
        state: string | null;
        country: string | null;
        address: string | null;
        latitude?: number | null;
        longitude?: number | null;
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
                    // Construct URL safely
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
                    const endpoint = '/auth/me';

                    // If baseUrl ends with '/api' and we append '/auth/me', it's properly '/api/auth/me'
                    // But if baseUrl is just '/api' (from env), it becomes '/api/auth/me' (Correct for proxy)
                    // If baseUrl is 'http://localhost:4000', we need to ensure /api is there? 
                    // Verify logic:
                    // If env is /api -> /api/auth/me -> Proxy Correct.
                    // If env missing -> http://localhost:4000/api/auth/me -> Direct Correct.

                    // Wait, if I want to be 100% safe against the "double api" issue seen in Map.tsx (which was /api + /api/banners),
                    // here we are appending /auth/me. 
                    // So if baseUrl is /api, we get /api/auth/me. Correct.
                    // If baseUrl is http://localhost:4000, we get http://localhost:4000/auth/me. MISSING /api?
                    // The default above has /api. So http://localhost:4000/api/auth/me. Correct.

                    // So URL construction seems okay, but maybe headers are the issue.

                    let url = `${baseUrl}/auth/me`;
                    if (process.env.NEXT_PUBLIC_API_URL === '/api') {
                        url = `/api/auth/me`;
                    }

                    const res = await fetch(url, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Bypass-Tunnel-Reminder': 'true',
                            'Content-Type': 'application/json'
                        }
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
