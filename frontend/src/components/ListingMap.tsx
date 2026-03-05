'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon, DivIcon } from 'leaflet';
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

// Custom Weed/Green Theme Marker
const createCustomIcon = () => {
    return new DivIcon({
        className: 'custom-marker',
        html: `
            <div class="relative group">
                <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 border-2 border-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-white">
                        <path d="M13.978 2.344a.75.75 0 01.534.821c-.247 2.274.654 4.045 2.158 5.56 1.488 1.498 3.161 2.215 5.385 1.77a.75.75 0 01.815.992c-.89 1.942-2.347 3.447-4.14 4.168 1.353 2.135 1.54 4.887.697 6.892a.75.75 0 01-1.359-.652c.655-1.558.487-3.799-.955-5.908-.344-.503-.73-.997-1.157-1.479l.542 6.649a.75.75 0 01-1.494.122l-.76-9.324a10.983 10.983 0 01-.76 9.324.75.75 0 01-1.494-.122l.542-6.649c-.427.482-.813.976-1.157 1.479-1.442 2.109-1.61 4.35-.955 5.908a.75.75 0 01-1.36.652c-.842-2.005-.655-4.757.698-6.892-1.794-.72-3.25-2.226-4.14-4.168a.75.75 0 01.815-.992c2.224.445 3.897-.272 5.385-1.77 1.504-1.515 2.405-3.286 2.158-5.56a.75.75 0 01.534-.821z" />
                    </svg>
                </div>
                <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-green-600 rotate-45 border-r border-b border-white"></div>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 42],
        popupAnchor: [0, -42]
    });
};

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
    const weedIcon = createCustomIcon();

    // Image URL helper
    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL === '/api'
            ? 'http://localhost:4000'
            : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
        return `${baseUrl}${path}`;
    };

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
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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
                        <Marker key={listing.id} position={[lat, lng]} icon={weedIcon}>
                            <Popup className="custom-popup">
                                <div className="min-w-[240px] p-0">
                                    <div className="relative h-32 w-full mb-3 rounded-t-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={getImageUrl(listing.images?.[0] || 'https://placehold.co/600x400?text=No+Image')}
                                            alt={listing.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.onerror = null; // Prevent infinite loop
                                                target.src = 'https://placehold.co/600x400?text=No+Image';
                                            }}
                                        />
                                        <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-green-700 shadow-sm">
                                            RM {listing.price}
                                        </div>
                                    </div>
                                    <div className="px-1 pb-1">
                                        <h3 className="font-bold text-base mb-1 truncate">{listing.title}</h3>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200">
                                                <img
                                                    src={getImageUrl(listing.seller?.sellerProfile?.profilePicture || '/default-avatar.png')}
                                                    alt={listing.seller?.name || 'Seller'}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <span className="text-xs text-gray-600 truncate">{listing.seller?.name || 'Unknown Seller'}</span>
                                        </div>
                                        <Link href={`/dashboard/marketplace/${listing.id}`} className="block w-full py-2 bg-green-600 text-white text-center text-sm font-semibold rounded hover:bg-green-700 transition">
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
