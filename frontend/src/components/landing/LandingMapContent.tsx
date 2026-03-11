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

// Scattered Dummy Locations (Centered around London for example, but scattered)
const DUMMY_SELLERS = [
    { id: 1, name: "Maria's Nursery", lat: 51.525, lng: -0.08, description: "Homegrown succulents & cacti" },
    { id: 2, name: "East End Greens", lat: 51.515, lng: -0.04, description: "Organic herbs and veggies" },
    { id: 3, name: "River Plant Co.", lat: 51.495, lng: -0.12, description: "Tropical plants specialist" },
    { id: 4, name: "Hyde Park Botanics", lat: 51.508, lng: -0.16, description: "Rare ferns and mosses" },
    { id: 5, name: "Camden Cuttings", lat: 51.538, lng: -0.14, description: "Propagations and starters" }
];

export default function LandingMapContent() {
    return (
        <MapContainer
            center={[51.515, -0.1]} // Slightly adjusted center to fit scattered points
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
