'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';

// Fix Leaflet Default Icon issue
const customIcon = new Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

// Scattered Dummy Locations (Centered around Sydney, but scattered)
const DUMMY_SELLERS = [
    { id: 1, name: "Emerald Coast Collective", lat: -33.8742, lng: 151.2018, description: "Indoor-grown selections" },
    { id: 2, name: "Harbour Green Supply", lat: -33.9126, lng: 151.1674, description: "small-batch cultivation with consistent quality control" },
    { id: 3, name: "River Plant Co.", lat: -33.8421, lng: 151.2487, description: "varieties grown using sustainable cultivation practices" },
    { id: 4, name: "Pacific Leaf Traders", lat: -33.8957, lng: 151.2213, description: "Independent grower collective" },
    { id: 5, name: "Camden Cuttings", lat: -33.8589, lng: 151.2745, description: "Marketplace vendor providing carefully curated premium buds" }
];

export default function LandingMapContent() {
    return (
        <MapContainer
            center={[-33.8767, 151.2227]} // Slightly adjusted center to fit scattered points
            zoom={12}
            scrollWheelZoom={false}
            className="h-full w-full"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {DUMMY_SELLERS.map((seller) => (
                <Marker key={seller.id} position={[seller.lat, seller.lng]} icon={customIcon}>
                    <Popup>
                        <div className="p-1 min-w-[150px]" style={{ color: '#111827' }}>
                            <h3 className="font-bold text-base" style={{ color: '#111827' }}>{seller.name}</h3>
                            <p className="text-sm text-gray-600" style={{ color: '#4B5563' }}>{seller.description}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
