"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

interface SellerLocationMapProps {
  latitude: number;
  longitude: number;
  sellerName: string;
}

export default function SellerLocationMap({
  latitude,
  longitude,
  sellerName,
}: SellerLocationMapProps) {
  const [customIcon, setCustomIcon] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      const icon = new L.Icon({
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      setCustomIcon(icon);
    })();
  }, []);

  if (!customIcon)
    return <div className="h-full w-full bg-gray-100 animate-pulse" />;

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={14}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[latitude, longitude]} icon={customIcon}>
        <Popup>{sellerName}'s Location</Popup>
      </Marker>
    </MapContainer>
  );
}
