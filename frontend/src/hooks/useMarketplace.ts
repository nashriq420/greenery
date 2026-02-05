import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export interface Seller {
    id: string;
    userId: string;
    description: string | null;
    latitude: number;
    longitude: number;
    city: string | null;
    name: string;
    email: string;
    distance?: number;
    profilePicture: string | null;
    lastSeen: string | Date | null;
    averageRating: number | null;
    reviewCount: number | null;
}

export function useSellers(lat: number, lng: number, radius: number = 50) {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(false);
    const { token } = useAuthStore();

    useEffect(() => {
        if (!token) return;

        const fetchSellers = async () => {
            if (!lat || !lng) return; // Guard against missing/invalid coordinates
            setLoading(true);
            try {
                const data = await api.get(`/marketplace/sellers?lat=${lat}&lng=${lng}&radius=${radius}`, token);
                if (Array.isArray(data)) {
                    setSellers(data);
                }
            } catch (error) {
                console.error("Failed to fetch sellers", error);
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(fetchSellers, 500); // Debounce
        return () => clearTimeout(timeout);

    }, [lat, lng, radius, token]);

    return { sellers, loading };
}

export interface Listing {
    id: string;
    title: string;
    description: string;
    price: string;
    active?: boolean;
    status: 'PENDING' | 'ACTIVE' | 'SOLD' | 'REJECTED';
    imageUrl: string | null;
    seller: {
        id: string;
        name: string;
        sellerProfile: {
            city: string | null;
            state: string | null;
            latitude?: number;
            longitude?: number;
        } | null;
    };
    createdAt?: string;
}

export function useListings(lat?: number | null, lng?: number | null, radius?: number) {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(false);
    const { token } = useAuthStore();

    const fetchListings = async () => {
        setLoading(true);
        try {
            let url = '/marketplace/listings';
            const params = new URLSearchParams();
            if (lat && lng) {
                params.append('lat', lat.toString());
                params.append('lng', lng.toString());
                if (radius) params.append('radius', radius.toString());
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            // Public endpoint potentially, but using token if available is good practice generally
            const data = await api.get(url, token || undefined);
            if (Array.isArray(data)) {
                setListings(data);
            }
        } catch (error) {
            console.error("Failed to fetch listings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, [token, lat, lng, radius]);

    return { listings, loading, refetch: fetchListings };
}

export function useMyListings() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(false);
    const { token, user } = useAuthStore();

    const fetchListings = async () => {
        if (!token || user?.role !== 'SELLER') return;
        setLoading(true);
        try {
            const data = await api.get('/marketplace/my-listings', token);
            if (Array.isArray(data)) {
                setListings(data);
            }
        } catch (error) {
            console.error("Failed to fetch my listings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, [token]);

    return { listings, loading, refetch: fetchListings };
}

export const createListing = async (data: { title: string; description: string; price: number; imageUrl?: string }, token: string) => {
    return await api.post('/marketplace/listings', data, token);
};
