'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { useEffect, useState } from 'react';
import { useSellers } from '@/hooks/useMarketplace';
import Link from 'next/link';

// Fix Leaflet Default Icon issue in Next.js
const customIcon = new Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Component to handle map view updates
function RecenterMap({ lat, lng }: { lat: number, lng: number }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            map.setView([lat, lng], 13);
        }
    }, [lat, lng, map]);
    return null;
}

export default function MapComponent() {
    const [isMounted, setIsMounted] = useState(false);
    // Default config (London)
    const [center, setCenter] = useState({ lat: 51.505, lng: -0.09 });
    const { sellers } = useSellers(center.lat, center.lng, 50);
    const [banner, setBanner] = useState<any>(null);

    useEffect(() => {
        setIsMounted(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    if (latitude && longitude) {
                        setCenter({
                            lat: latitude,
                            lng: longitude
                        });
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                }
            );
        }

        // Fetch active banner
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/banners/active`)
            .then(res => {
                if (res.ok) return res.json();
                return null;
            })
            .then(data => setBanner(data))
            .catch(err => console.error("Error fetching banner:", err));
    }, []);

    if (!isMounted) {
        return <div className="h-[500px] w-full bg-muted animate-pulse rounded-lg"></div>;
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Banner Section */}
            {banner && (
                <Link href={`/dashboard/marketplace/${banner.listingId}`} className="block w-full transition-transform hover:scale-[1.01]">
                    <div className="w-full h-[200px] relative rounded-lg overflow-hidden shadow-md group border border-green-100">
                        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent group-hover:from-black/60 transition-all z-10 flex flex-col justify-center px-8">
                            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg tracking-tight">Product of the Week</h1>
                            {banner.title && (
                                <p className="text-white/90 text-lg font-medium drop-shadow mt-2 max-w-[60%]">{banner.title}</p>
                            )}
                            <span className="mt-4 inline-block px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-full w-fit hover:bg-green-700 transition">View Deal</span>
                        </div>
                        <img
                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${banner.imageUrl}`}
                            alt={banner.title || "Product of the week"}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </Link>
            )}

            {/* Map Section */}
            <div className="h-[500px] w-full rounded-lg overflow-hidden border relative bg-muted shadow-sm">
                <MapContainer
                    center={[center.lat, center.lng]}
                    zoom={13}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                >
                    <RecenterMap lat={center.lat} lng={center.lng} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {sellers.map((seller) => (
                        <Marker key={seller.id} position={[seller.latitude, seller.longitude]} icon={customIcon}>
                            <Popup>
                                <div className="p-1">
                                    <h3 className="font-bold">{seller.name}</h3>
                                    <p className="text-sm text-gray-600">{seller.city}</p>
                                    <p className="text-xs text-gray-500 mt-1">{seller.description}</p>
                                    <a href={`/dashboard/seller/${seller.userId}`} className="block mt-2 text-green-600 text-sm hover:underline">View Profile</a>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    <Marker position={[center.lat, center.lng]} icon={customIcon} opacity={0.5}>
                        <Popup>You are here</Popup>
                    </Marker>
                </MapContainer>
            </div>
        </div>
    );
}
