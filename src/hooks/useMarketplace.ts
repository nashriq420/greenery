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
