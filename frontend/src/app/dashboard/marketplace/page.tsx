'use client';

import { useState } from 'react';
import { useListings, createListing } from '@/hooks/useMarketplace';
import { calculateDistance } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

export default function MarketplacePage() {
    const { user, token } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        imageUrl: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Location & View State
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Pass location params to hook
    const { listings, loading, refetch } = useListings(userLocation?.lat, userLocation?.lng, 50);

    // Sort listings by distance if location is available
    const sortedListings = [...listings].sort((a, b) => {
        if (!userLocation) return 0;

        const getDist = (l: typeof a) => {
            if (l.seller.sellerProfile?.latitude && l.seller.sellerProfile?.longitude) {
                return calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    l.seller.sellerProfile.latitude,
                    l.seller.sellerProfile.longitude
                );
            }
            return Infinity;
        };

        return getDist(a) - getDist(b);
    });

    const handleUseLocation = () => {
        if (userLocation) {
            // Toggle off
            setUserLocation(null);
            return;
        }

        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocationError(null);
            },
            () => {
                setLocationError("Unable to retrieve your location");
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setSubmitting(true);
        try {
            await createListing({
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                imageUrl: formData.imageUrl || undefined
            }, token);

            setIsModalOpen(false);
            setFormData({ title: '', description: '', price: '', imageUrl: '' });
            refetch();
        } catch (error) {
            alert('Failed to create listing');
        } finally {
            setSubmitting(false);
        }
    };

    // Lazy load map to avoid server-side issues with Leaflet
    const ListingMap = dynamic(() => import('@/components/ListingMap'), {
        ssr: false,
        loading: () => <div className="h-[500px] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">Loading Map...</div>
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <h1 className="text-2xl font-bold">Marketplace</h1>

                <div className="flex gap-2 items-center">
                    <button
                        onClick={handleUseLocation}
                        className={`px-3 py-1.5 rounded-lg text-sm border flex items-center gap-2 ${userLocation ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <MapPin size={16} />
                        {userLocation ? 'Nearby (50km)' : 'Use My Location'}
                    </button>

                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1.5 rounded-md text-sm transition ${viewMode === 'grid' ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`px-3 py-1.5 rounded-md text-sm transition ${viewMode === 'map' ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Map
                        </button>
                    </div>

                    {user?.role === 'SELLER' && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            Create Listing
                        </button>
                    )}
                </div>
            </div>

            {locationError && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded border border-red-200 text-sm">
                    {locationError}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>)}
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sortedListings.length === 0 ? (
                                <p className="col-span-full text-center text-gray-500 py-10">No active listings found.</p>
                            ) : (
                                sortedListings.map((listing) => (
                                    <Link href={`/dashboard/marketplace/${listing.id}`} key={listing.id} className="block">
                                        <div className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition h-full">
                                            <div className="h-48 bg-gray-200 relative">
                                                {listing.imageUrl ? (
                                                    <div className="w-full h-48 bg-gray-100 relative">
                                                        <img
                                                            src={listing.imageUrl}
                                                            alt={listing.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                                )}
                                                <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-sm font-bold shadow">
                                                    RM {listing.price}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-lg">{listing.title}</h3>
                                                {userLocation && listing.seller.sellerProfile?.latitude && listing.seller.sellerProfile?.longitude && (
                                                    <div className="flex items-center gap-1 text-green-600 text-xs font-semibold mb-1">
                                                        <MapPin size={12} />
                                                        <span>
                                                            {calculateDistance(
                                                                userLocation.lat,
                                                                userLocation.lng,
                                                                listing.seller.sellerProfile.latitude,
                                                                listing.seller.sellerProfile.longitude
                                                            )} km away
                                                        </span>
                                                    </div>
                                                )}
                                                <p className="text-sm text-gray-500 mb-2">by {listing.seller.name}</p>
                                                <p className="text-gray-600 line-clamp-2 text-sm">{listing.description}</p>
                                                <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
                                                    <span>{listing.seller.sellerProfile?.city || 'Unknown Location'}</span>
                                                    <span>{new Date(listing.createdAt || Date.now()).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    ) : (
                        <ListingMap listings={sortedListings} userLocation={userLocation} />
                    )}
                </>
            )}

            {/* Simple Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">New Listing</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    required
                                    className="w-full border rounded p-2"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Price ($)</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full border rounded p-2"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    required
                                    className="w-full border rounded p-2"
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Image URL (Optional)</label>
                                <input
                                    className="w-full border rounded p-2"
                                    value={formData.imageUrl}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex gap-2 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
