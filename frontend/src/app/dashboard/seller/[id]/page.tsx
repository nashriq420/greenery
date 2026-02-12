'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, MapPin, Calendar, MessageCircle, Clock, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';

// Fix Leaflet marker icon
const icon = new Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

export default function SellerProfilePage() {
    const params = useParams();
    const id = params?.id as string;
    const { token, user } = useAuthStore();

    const [seller, setSeller] = useState<any>(null);
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Menus'); // Default to Menus as per request imply "current listing... leave as it is" inside tab

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch Seller Details
                // If token is available, use it (though endpoint is public, might be useful later)
                const sellerData = await api.get(`/marketplace/sellers/${id}`, token || undefined);
                setSeller(sellerData);

                // Fetch Listings
                const allListings = await api.get('/marketplace/listings', token || undefined);
                if (Array.isArray(allListings)) {
                    // Filter by sellerId
                    // Note: Backend getListings doesn't strictly support filtering by sellerId in query yet for public (only my-listings), 
                    // so we filter client side as before or we could update backend to support ?sellerId=... 
                    // For now, client side filtering to match previous logic safely.
                    const sellerListings = allListings.filter((l: any) => l.seller.id === id);
                    setListings(sellerListings);
                }
            } catch (e) {
                console.error("Error fetching seller profile:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, token]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[500px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
    );

    if (!seller) return <div className="p-8 text-center text-xl text-gray-500">Seller not found.</div>;

    const joinedDate = new Date(seller.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const rating = seller.averageRating ? Number(seller.averageRating).toFixed(1) : 'New';
    const reviewCount = seller.reviewCount || 0;

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Banner Area */}
            <div className="relative w-full h-48 md:h-64 bg-gray-200 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1603569283847-aa295f0d016a?q=80&w=1000&auto=format&fit=crop"
                    alt="Cover Banner"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Profile Header Info */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-16 mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                        {/* Profile Picture */}
                        <div className="relative z-10">
                            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                                <img
                                    src={seller.profilePicture || `https://ui-avatars.com/api/?name=${seller.name}&background=random`}
                                    alt={seller.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Name and Handle */}
                        <div className="flex-1 mt-4 md:mt-0 md:mb-2">
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{seller.name}</h1>
                            <p className="text-gray-500 font-medium">@{seller.username || seller.name.replace(/\s+/g, '').toLowerCase()}</p>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="mt-6 space-y-4">
                        {/* Status / Hours */}
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <span className="text-red-500 text-lg">💈</span>
                            <span>OPEN 7Days</span>
                            <span className="text-red-500 text-lg">💈</span>
                            <span>10am-10pm</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-full flex items-center gap-2 transition">
                                <span className="text-lg">♡</span> Favorite
                            </button>
                            {user?.id !== id && (
                                <button
                                    onClick={async () => {
                                        if (!token) return alert('Please login to chat');
                                        try {
                                            const chat = await api.post('/chat', { participantId: id }, token);
                                            window.location.href = `/dashboard/chat/${chat.id}`;
                                        } catch (e) {
                                            alert('Failed to start chat');
                                        }
                                    }}
                                    className="px-6 py-2 bg-green-50 text-green-700 font-semibold rounded-full flex items-center gap-2 hover:bg-green-100 border border-green-200 transition"
                                >
                                    <MessageCircle className="w-4 h-4" /> Message
                                </button>
                            )}
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-8 text-sm text-gray-600 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="flex text-green-500">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(seller.averageRating || 0)) ? 'fill-current' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                                <span className="font-semibold text-gray-900">{rating}</span>
                                <span>of {reviewCount} reviews</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{seller.sellerProfile?.city || 'Location hidden'}, {seller.sellerProfile?.state || ''}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>Joined {joinedDate}</span>
                            </div>

                            {/* Placeholder for Following count as requested in screenshot design, though strictly "except follow" was requested, static consistency usually preferred */}
                            {/* <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">356</span> Following
                            </div> */}
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200 mt-8">
                    <nav className="flex -mb-px space-x-8 overflow-x-auto">
                        {['Home', 'Menus', 'Reviews', 'Show on Map'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${activeTab === tab
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                `}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="py-6 min-h-[400px]">
                    {activeTab === 'Home' && (
                        <div className="prose max-w-none text-gray-600">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">About the Seller</h3>
                            <p>{seller.sellerProfile?.description || "No description provided."}</p>
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                                <h4 className="font-medium text-gray-900 mb-2">Location & Details</h4>
                                <p className="text-sm">Address: {seller.sellerProfile?.address || "Hiddent for privacy"}</p>
                                <p className="text-sm">City: {seller.sellerProfile?.city}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Menus' && (
                        <div>
                            <div className="bg-green-600 text-white p-3 rounded-t-lg mb-4 flex justify-between items-center shadow-sm">
                                <span className="font-bold text-lg">Cannabis Menus</span>
                                {/* Search/Filter placeholder if needed */}
                            </div>

                            {listings.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                                    No active listings found for this seller.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {listings.map((listing) => (
                                        <Link href={`/dashboard/marketplace/${listing.id}`} key={listing.id} className="group block h-full">
                                            <div className="bg-white border rounded-xl overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                                <div className="h-48 bg-gray-100 relative overflow-hidden">
                                                    {listing.imageUrl ? (
                                                        <img
                                                            src={listing.imageUrl}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            alt={listing.title}
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-gray-400">
                                                            <span className="text-sm">No Image</span>
                                                        </div>
                                                    )}
                                                    {listing.strainType && (
                                                        <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                                            {listing.strainType}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="p-4 flex flex-col flex-1">
                                                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors line-clamp-1">{listing.title}</h3>
                                                    <div className="flex justify-between items-center mt-auto">
                                                        <p className="text-green-600 font-bold text-lg">${Number(listing.price).toFixed(2)}</p>
                                                        {listing.minQuantity > 1 && (
                                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Min: {listing.minQuantity}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'Reviews' && (
                        <div className="text-center py-10 text-gray-500">
                            <p>Reviews will appear here.</p>
                            <div className="mt-4 inline-flex items-center gap-2 text-yellow-500 font-bold text-xl">
                                <Star className="fill-current" /> {rating} <span className="text-gray-400 text-sm font-normal">({reviewCount} reviews)</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Show on Map' && (
                        <div className="h-[400px] rounded-xl overflow-hidden border shadow-inner">
                            {typeof window !== 'undefined' && seller.sellerProfile?.latitude && (
                                <MapContainer
                                    center={[seller.sellerProfile.latitude, seller.sellerProfile.longitude]}
                                    zoom={14}
                                    scrollWheelZoom={false}
                                    className="h-full w-full"
                                >
                                    <TileLayer
                                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    <Marker
                                        position={[seller.sellerProfile.latitude, seller.sellerProfile.longitude]}
                                        icon={icon}
                                    >
                                        <Popup>{seller.name}'s Location</Popup>
                                    </Marker>
                                </MapContainer>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
