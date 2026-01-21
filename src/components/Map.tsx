'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { useEffect, useState } from 'react';
import { useSellers } from '@/hooks/useMarketplace';

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
            // Use flyTo for smoother transition and potentially safer execution
            map.flyTo([lat, lng], 13, {
                animate: true,
                duration: 1.5
            });
        }
    }, [lat, lng, map]);
    return null;
}

export default function MapComponent() {
    const [isMounted, setIsMounted] = useState(false);
    // Default config (London)
    const [center, setCenter] = useState({ lat: 51.505, lng: -0.09 });
    const { sellers } = useSellers(center.lat, center.lng, 50);

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
    }, []);

    if (!isMounted) {
        return <div className="h-[500px] w-full bg-gray-100 animate-pulse rounded-lg"></div>;
    }

    return (
        // Add unique key to force cleanup if necessary, though simpler is better usually.
        // We leave the outer div stable.
        <div className="h-[500px] w-full rounded-lg overflow-hidden border relative">
            <MapContainer
                center={[51.505, -0.09]} // Static initial center
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

                {/* Current Location Marker */}
                <Marker position={[center.lat, center.lng]} icon={customIcon} opacity={0.5}>
                    <Popup>You are here</Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}
