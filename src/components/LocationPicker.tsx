'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Fix Leaflet Default Icon issue
const customIcon = new Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onLocationSelect: (data: {
        lat: number;
        lng: number;
        address: string;
        city: string;
        state: string;
        country: string;
    }) => void;
}

function LocationMarker({ position, setPosition, onDragEnd }: {
    position: { lat: number; lng: number };
    setPosition: (pos: { lat: number; lng: number }) => void;
    onDragEnd: (lat: number, lng: number) => void;
}) {
    const markerRef = useRef<any>(null);
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo([position.lat, position.lng], map.getZoom());
        }
    }, [position, map]);

    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition({ lat, lng });
            onDragEnd(lat, lng);
        },
    });

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker) {
                    const { lat, lng } = marker.getLatLng();
                    setPosition({ lat, lng });
                    onDragEnd(lat, lng);
                }
            },
        }),
        [onDragEnd, setPosition],
    );

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={customIcon}
        >
            <Popup>Selected Location</Popup>
        </Marker>
    );
}

export default function LocationPicker({ initialLat, initialLng, onLocationSelect }: LocationPickerProps) {
    const [position, setPosition] = useState<{ lat: number; lng: number }>({
        lat: initialLat || 51.505,
        lng: initialLng || -0.09
    });
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (initialLat && initialLng) {
            setPosition({ lat: initialLat, lng: initialLng });
        }
    }, [initialLat, initialLng]);

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
                headers: {
                    'User-Agent': 'GreeneryApp/1.0'
                }
            });
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const newLat = parseFloat(lat);
                const newLng = parseFloat(lon);

                setPosition({ lat: newLat, lng: newLng });

                // Fetch details for the new location to get structured address parts
                await fetchAddressDetails(newLat, newLng);
            } else {
                alert('Location not found');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Error searching for location');
        } finally {
            setLoading(false);
        }
    };

    const fetchAddressDetails = async (lat: number, lng: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
                headers: {
                    'User-Agent': 'GreeneryApp/1.0'
                }
            });
            const data = await response.json();
            if (data && data.address) {
                const addressData = {
                    lat,
                    lng,
                    address: data.display_name,
                    city: data.address.city || data.address.town || data.address.village || '',
                    state: data.address.state || data.address.region || '',
                    country: data.address.country || ''
                };
                onLocationSelect(addressData);
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        }
    };

    if (!isMounted) return <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-md" />;

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="flex-1">
                    <Label htmlFor="location-search" className="sr-only">Search Location</Label>
                    <Input
                        id="location-search"
                        placeholder="Search for a location (e.g. New York, Eiffel Tower)..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <Button onClick={handleSearch} disabled={loading} type="button">
                    {loading ? 'Searching...' : 'Search'}
                </Button>
            </div>

            <div className="h-[400px] w-full rounded-md overflow-hidden border z-0">
                <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                        position={position}
                        setPosition={setPosition}
                        onDragEnd={fetchAddressDetails}
                    />
                </MapContainer>
            </div>
            <p className="text-sm text-gray-500">
                Tip: Search for a location or drag the marker to pin-point your address.
            </p>
        </div>
    );
}
