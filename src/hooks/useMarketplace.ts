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
}

export function useSellers(lat: number, lng: number, radius: number = 50) {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(false);
    const { token } = useAuthStore();

    useEffect(() => {
        if (!token) return;

        const fetchSellers = async () => {
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
    imageUrl: string | null;
    seller: {
        id: string;
        name: string;
        sellerProfile: {
            city: string | null;
            state: string | null;
        } | null;
    };
    createdAt: string;
}

export function useListings() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(false);
    const { token } = useAuthStore();

    const fetchListings = async () => {
        setLoading(true);
        try {
            // Public endpoint potentially, but using token if available is good practice generally
            const data = await api.get('/marketplace/listings', token || undefined);
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
    }, [token]);

    return { listings, loading, refetch: fetchListings };
}

export const createListing = async (data: { title: string; description: string; price: number; imageUrl?: string }, token: string) => {
    return await api.post('/marketplace/listings', data, token);
};
