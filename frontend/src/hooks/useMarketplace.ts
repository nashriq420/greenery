import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

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
  subscriptionStatus?: string | null;
  openingHours?: string | null;
  bannerUrl?: string | null;
}

export function useSellers(
  lat?: number | null,
  lng?: number | null,
  radius: number = 50,
) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    const fetchSellers = async () => {
      setLoading(true);
      try {
        let url = `/marketplace/sellers?radius=${radius}`;
        if (
          lat !== undefined &&
          lat !== null &&
          lng !== undefined &&
          lng !== null
        ) {
          url += `&lat=${lat}&lng=${lng}`;
        }
        const data = await api.get(url, token);
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
  status: "PENDING" | "ACTIVE" | "SOLD" | "REJECTED";
  imageUrl: string | null;
  videoUrl?: string | null;
  sku?: string | null; // Sku added

  // New Fields
  deliveryAvailable?: boolean;
  minQuantity?: number;
  strainType?: "Indica" | "Sativa" | "Hybrid" | null | string;
  thcContent?: number | null;
  cbdContent?: number | null;
  type?: string | null;
  flavors?: string | null;
  effects?: string | null;

  seller: {
    id: string;
    name: string;
    sellerProfile: {
      city: string | null;
      state: string | null;
      latitude?: number;
      longitude?: number;
    } | null;
    subscription?: {
      status: string;
    } | null;
  };
  createdAt?: string;
}

export interface ListingFilters {
  lat?: number | null;
  lng?: number | null;
  radius?: number;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  strainType?: string;
  type?: string;
  deliveryAvailable?: boolean;
  thcMin?: string;
  cbdMin?: string;
}

export function useListings(filters: ListingFilters = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  const fetchListings = async () => {
    setLoading(true);
    try {
      let url = "/marketplace/listings";
      const params = new URLSearchParams();

      // Location
      if (filters.lat && filters.lng) {
        params.append("lat", filters.lat.toString());
        params.append("lng", filters.lng.toString());
        if (filters.radius) params.append("radius", filters.radius.toString());
      }

      // Text Search
      if (filters.search) params.append("search", filters.search);

      // Filters
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.strainType) params.append("strainType", filters.strainType);
      if (filters.type) params.append("type", filters.type);
      if (filters.deliveryAvailable !== undefined)
        params.append("deliveryAvailable", String(filters.deliveryAvailable));
      if (filters.thcMin) params.append("thcMin", filters.thcMin);
      if (filters.cbdMin) params.append("cbdMin", filters.cbdMin);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Public endpoint, but allows token usage
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
    setLoading(true);
    const timeout = setTimeout(fetchListings, 500);
    return () => clearTimeout(timeout);
  }, [token, JSON.stringify(filters)]);

  return { listings, loading, refetch: fetchListings };
}

export function useMyListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuthStore();

  const fetchListings = async () => {
    if (!token || user?.role !== "SELLER") return;
    setLoading(true);
    try {
      const data = await api.get("/marketplace/my-listings", token);
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

export const createListing = async (
  data: {
    title: string;
    description: string;
    price: number;
    imageUrl?: string;
    sku?: string;
    deliveryAvailable?: boolean;
    minQuantity?: number;
    strainType?: string;
    thcContent?: number;
    cbdContent?: number;
    type?: string;
    flavors?: string;
    effects?: string;
  },
  token: string,
) => {
  return await api.post("/marketplace/listings", data, token);
};
