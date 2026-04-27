"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon, DivIcon } from "leaflet";
import { useEffect, useState } from "react";
import { useSellers } from "@/hooks/useMarketplace";
import Link from "next/link";
import { Star, Clock, MapPin, Check } from "lucide-react";
import { getBaseUrl } from "@/lib/config";

// Custom Weed/Green Theme Marker
const createCustomIcon = (isPremium: boolean = false) => {
  // Bigger sizing for premium
  const bgClass = isPremium
    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-200"
    : "bg-green-600 border-white";
  const sizeClass = isPremium ? "w-14 h-14" : "w-10 h-10";
  const iconSizeClass = isPremium ? "w-8 h-8" : "w-6 h-6";
  const pointerClass = isPremium
    ? "bg-yellow-500 border-yellow-200"
    : "bg-green-600 border-white";

  // Adjust leaflet anchor sizes based on premium or not
  const markerSize: [number, number] = isPremium ? [56, 56] : [40, 40];
  const markerAnchor: [number, number] = isPremium ? [28, 58] : [20, 42];
  const popupAnchor: [number, number] = isPremium ? [0, -58] : [0, -42];

  return new DivIcon({
    className: "custom-marker",
    html: `
            <div class="relative group">
                <div class="${sizeClass} ${bgClass} rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 border-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="${iconSizeClass} text-white">
                        <path d="M13.978 2.344a.75.75 0 01.534.821c-.247 2.274.654 4.045 2.158 5.56 1.488 1.498 3.161 2.215 5.385 1.77a.75.75 0 01.815.992c-.89 1.942-2.347 3.447-4.14 4.168 1.353 2.135 1.54 4.887.697 6.892a.75.75 0 01-1.359-.652c.655-1.558.487-3.799-.955-5.908-.344-.503-.73-.997-1.157-1.479l.542 6.649a.75.75 0 01-1.494.122l-.76-9.324a10.983 10.983 0 01-.76 9.324.75.75 0 01-1.494-.122l.542-6.649c-.427.482-.813.976-1.157 1.479-1.442 2.109-1.61 4.35-.955 5.908a.75.75 0 01-1.36.652c-.842-2.005-.655-4.757.698-6.892-1.794-.72-3.25-2.226-4.14-4.168a.75.75 0 01.815-.992c2.224.445 3.897-.272 5.385-1.77 1.504-1.515 2.405-3.286 2.158-5.56a.75.75 0 01.534-.821z" />
                    </svg>
                    ${isPremium ? `<div class="absolute -top-1 -right-1 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center shadow"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-2.5 h-2.5 text-white"><polyline points="20 6 9 17 4 12"></polyline></svg></div>` : ""}
                </div>
                <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 ${pointerClass} rotate-45 border-r border-b"></div>
            </div>
        `,
    iconSize: markerSize,
    iconAnchor: markerAnchor,
    popupAnchor: popupAnchor,
  });
};

const userIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to handle map view updates
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      // Check if map is still valid - though useMap context usually handles this
      try {
        map.setView([lat, lng], 13);
      } catch (e) {
        console.warn("Map setView error:", e);
      }
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
              lng: longitude,
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }

    // URL Construction helper
    const getApiUrl = (endpoint: string) => {
      return `${getBaseUrl()}/api${endpoint}`;
    };

    // Fetch active banner
    fetch(getApiUrl("/banners/active"))
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => setBanner(data))
      .catch((err) => console.error("Error fetching banner:", err));
  }, []);

  // Image URL helper
  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${getBaseUrl()}${path}`;
  };

  // Helper to format last seen
  const formatLastSeen = (dateString: string | Date | null) => {
    if (!dateString) return "Offline";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 5) return "Online now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (!isMounted) {
    return (
      <div className="h-[500px] w-full bg-muted animate-pulse rounded-lg"></div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Banner Section */}
      {banner && (
        <Link
          href={`/dashboard/marketplace/${banner.listingId}`}
          className="block w-full transition-transform hover:scale-[1.01]"
        >
          <div className="w-full h-[200px] relative rounded-lg overflow-hidden shadow-md group border border-green-100">
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent group-hover:from-black/60 transition-all z-10 flex flex-col justify-center px-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg tracking-tight">
                Product of the Week
              </h1>
              {banner.title && (
                <p className="text-white/90 text-lg font-medium drop-shadow mt-2 max-w-[60%]">
                  {banner.title}
                </p>
              )}
              <span className="mt-4 inline-block px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-full w-fit hover:bg-green-700 transition">
                View Deal
              </span>
            </div>
            <img
              src={getImageUrl(banner.imageUrl)}
              alt={banner.title || "Product of the week"}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
      )}

      {/* Map Section */}
      <div className="h-[500px] w-full rounded-lg overflow-hidden border relative bg-muted shadow-sm ring-1 ring-green-100">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <RecenterMap lat={center.lat} lng={center.lng} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {sellers.map((seller) => {
            const markerIcon = createCustomIcon(
              seller.subscriptionStatus === "ACTIVE",
            );
            return (
              <Marker
                key={seller.id}
                position={[seller.latitude, seller.longitude]}
                icon={markerIcon}
              >
                <Popup className="custom-popup">
                  <div className="p-0 min-w-[240px]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-100 shadow-sm">
                          <img
                            src={getImageUrl(
                              seller.profilePicture || "/default-avatar.png",
                            )}
                            alt={seller.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src =
                                "https://ui-avatars.com/api/?name=" +
                                encodeURIComponent(seller.name);
                            }}
                          />
                        </div>
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            seller.lastSeen &&
                            new Date(seller.lastSeen).getTime() >
                              Date.now() - 1000 * 60 * 5 // 5 mins
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        ></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base leading-tight text-gray-900 flex items-center gap-1">
                            {seller.name}
                            {seller.subscriptionStatus === "ACTIVE" && (
                              <span
                                title="Verified Premium Seller"
                                className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 text-white rounded-full shadow-sm shrink-0"
                              >
                                <Check className="w-3 h-3" strokeWidth={3} />
                              </span>
                            )}
                          </h3>
                          {seller.subscriptionStatus === "ACTIVE" && (
                            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm shrink-0">
                              <Star size={10} fill="currentColor" /> Premium
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500 text-xs mt-0.5">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="font-medium text-gray-700">
                            {seller.averageRating
                              ? Number(seller.averageRating).toFixed(1)
                              : "New"}
                          </span>
                          <span className="text-gray-400">
                            ({seller.reviewCount || 0})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        <span className="truncate max-w-[180px]">
                          {seller.city || "Location hidden"}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        <span>Seen {formatLastSeen(seller.lastSeen)}</span>
                      </div>
                    </div>

                    {seller.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed bg-gray-50 p-2 rounded">
                        {seller.description}
                      </p>
                    )}

                    <Link
                      href={`/dashboard/seller/${seller.userId}`}
                      className="flex items-center justify-center w-full py-2 bg-green-600 !text-white text-sm font-semibold rounded-md hover:bg-green-700 transition shadow-sm"
                    >
                      Visit Store
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          <Marker
            position={[center.lat, center.lng]}
            icon={userIcon}
            opacity={0.7}
          >
            <Popup>
              <span className="font-medium text-sm">You are here</span>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          padding: 0;
          overflow: hidden;
          border-radius: 0.75rem;
          box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-content {
          margin: 0;
          padding: 16px;
          width: 260px !important;
        }
        .leaflet-container a.leaflet-popup-close-button {
          top: 8px;
          right: 8px;
          color: #9ca3af;
          padding: 4px;
        }
        .leaflet-container a.leaflet-popup-close-button:hover {
          color: #4b5563;
        }
      `}</style>
    </div>
  );
}
