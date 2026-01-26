'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Fix for default marker icon in Next.js
const customIcon = new Icon({
    iconUrl: '/marker-icon.png',
    shadowUrl: '/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// If you don't have local icons, use CDN:
const defaultIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface ListingMapProps {
    listings: any[];
    userLocation: { lat: number; lng: number } | null;
}

export default function ListingMap({ listings, userLocation }: ListingMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const center = userLocation ? [userLocation.lat, userLocation.lng] : [3.140853, 101.693207]; // Default to KL

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-green-900/20 z-0 relative">
            <MapContainer
                center={center as [number, number]}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User Location Marker */}
                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={defaultIcon}>
                        <Popup>
                            You are here
                        </Popup>
                    </Marker>
                )}

                {/* Listing Markers */}
                {listings.map((listing) => {
                    const lat = listing.seller?.sellerProfile?.latitude;
                    const lng = listing.seller?.sellerProfile?.longitude;

                    if (!lat || !lng) return null;

                    return (
                        <Marker key={listing.id} position={[lat, lng]} icon={defaultIcon}>
                            <Popup>
                                <div className="min-w-[150px]">
                                    <h3 className="font-bold text-sm">{listing.title}</h3>
                                    <p className="text-xs text-green-700 font-semibold mb-1">RM {listing.price}</p>
                                    <Link href={`/marketplace/${listing.id}`} className="text-xs text-blue-600 hover:underline">
                                        View Details
                                    </Link>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
