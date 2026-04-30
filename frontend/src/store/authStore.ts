import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getApiUrl } from "@/lib/config";

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  profilePicture?: string;
  role: "CUSTOMER" | "SELLER" | "ADMIN" | "SUPERADMIN";
  needsLocationSetup?: boolean;
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
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isInitialized: false,

      login: (user) => set({ user, isAuthenticated: true, isInitialized: true }),

      logout: async () => {
        try {
          // Tell the backend to clear the HTTP-only cookie
          await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.warn("Logout request failed silently", e);
        }
        // Always clear local state regardless of network result
        set({ user: null, isAuthenticated: false, isInitialized: true });
      },

      updateUser: (user) => set({ user }),

      refreshUser: async () => {
        try {
          const baseUrl = getApiUrl();
          const url = `${baseUrl}/auth/me`;

          // No Authorization header needed — browser sends cookie automatically
          const res = await fetch(url, {
            credentials: "include",
            headers: {
              "Bypass-Tunnel-Reminder": "true",
              "Content-Type": "application/json",
            },
          });
          if (res.ok) {
            const user = await res.json();
            set({ user, isAuthenticated: true, isInitialized: true });
          } else {
            // Cookie is invalid/expired — log out
            set({ user: null, isAuthenticated: false, isInitialized: true });
          }
        } catch (e) {
          console.error("Failed to refresh user", e);
          set({ isInitialized: true });
        }
      },
    }),
    {
      name: "auth-storage",
      // Only persist the user object — isAuthenticated should be verified on every session start
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
