'use client';

import { useState } from 'react';
import { useListings, createListing } from '@/hooks/useMarketplace';
import { calculateDistance } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { MapPin, Check, Search, Filter, X, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const PRODUCT_TYPES = [
    "Concentrates", "Clones", "Extract", "Edible", "Flower",
    "Topicals", "Grow", "Gear", "Preroll", "Smoking",
    "Tinctures", "Vaporizers", "Unidentified", "Others"
];

export default function MarketplacePage() {
    const { user, token } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        imageUrl: '',
        discountPrice: '',
        promotionStart: '',
        promotionEnd: '',
        deliveryAvailable: false,
        minQuantity: '1',

        strainType: '',
        thcContent: '',
        cbdContent: '',
        type: '',
        flavors: '',
        effects: '',
        sku: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Location & View State
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Success Message State
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    // Valid Filter State
    const [filters, setFilters] = useState({
        search: '',
        minPrice: '',
        maxPrice: '',
        strainType: '',
        type: '',
        deliveryAvailable: false,
        thcMin: '',
        cbdMin: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    // Pass location params to hook
    const { listings, loading, refetch } = useListings({
        ...filters,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        radius: 50
    });

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
                deliveryAvailable: formData.deliveryAvailable,
                minQuantity: parseInt(formData.minQuantity) || 1,
                strainType: formData.strainType || undefined,
                thcContent: formData.thcContent ? parseFloat(formData.thcContent) : undefined,
                cbdContent: formData.cbdContent ? parseFloat(formData.cbdContent) : undefined,
                imageUrl: formData.imageUrl || undefined,
                type: formData.type || undefined,
                flavors: formData.flavors || undefined,
                effects: formData.effects || undefined,
                sku: formData.sku || undefined
            }, token);

            setIsModalOpen(false);
            setFormData({
                title: '', description: '', price: '', imageUrl: '',
                discountPrice: '', promotionStart: '', promotionEnd: '',
                deliveryAvailable: false, minQuantity: '1',
                strainType: '', thcContent: '', cbdContent: '',
                type: '', flavors: '', effects: '', sku: ''
            });
            refetch();
            setShowSuccessMessage(true);
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
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h1 className="text-2xl font-bold">Marketplace</h1>

                    <div className="flex gap-2 items-center flex-wrap">
                        <button
                            onClick={handleUseLocation}
                            className={`px-3 py-1.5 rounded-lg text-sm border flex items-center gap-2 ${userLocation ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <MapPin size={16} />
                            {userLocation ? 'Nearby (50km)' : 'My Location'}
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

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`gap-2 ${showFilters ? 'bg-gray-100' : ''}`}
                        >
                            <Filter size={16} />
                            Filters
                        </Button>

                        {user?.role === 'SELLER' && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                            >
                                + Listing
                            </button>
                        )}
                    </div>
                </div>

                {/* Search & Filter Panel */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Search listings..."
                            className="pl-10 bg-white"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    {showFilters && (
                        <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="text-xs font-semibold mb-1.5 block">Price Range</label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Min"
                                        className="h-8 bg-white"
                                        type="number"
                                        value={filters.minPrice}
                                        onChange={e => setFilters({ ...filters, minPrice: e.target.value })}
                                    />
                                    <span className="text-gray-400">-</span>
                                    <Input
                                        placeholder="Max"
                                        className="h-8 bg-white"
                                        type="number"
                                        value={filters.maxPrice}
                                        onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold mb-1.5 block">Strain Type</label>
                                <select
                                    className="w-full h-8 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={filters.strainType}
                                    onChange={e => setFilters({ ...filters, strainType: e.target.value })}
                                >
                                    <option value="">Any</option>
                                    <option value="Indica">Indica</option>
                                    <option value="Sativa">Sativa</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold mb-1.5 block">Type</label>
                                <select
                                    className="w-full h-8 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={filters.type || ''}
                                    onChange={e => setFilters({ ...filters, type: e.target.value })}
                                >
                                    <option value="">Any</option>
                                    {PRODUCT_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold mb-1.5 block">Potency (Min %)</label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        placeholder="THC"
                                        className="h-8 bg-white"
                                        type="number"
                                        value={filters.thcMin}
                                        onChange={e => setFilters({ ...filters, thcMin: e.target.value })}
                                    />
                                    <Input
                                        placeholder="CBD"
                                        className="h-8 bg-white"
                                        type="number"
                                        value={filters.cbdMin}
                                        onChange={e => setFilters({ ...filters, cbdMin: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border rounded-md w-full h-8 justify-center hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={filters.deliveryAvailable}
                                        onChange={e => setFilters({ ...filters, deliveryAvailable: e.target.checked })}
                                        className="w-4 h-4 text-green-600 rounded"
                                    />
                                    <span className="text-sm font-medium">Delivery Only</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {locationError && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded border border-red-200 text-sm">
                    {locationError}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>)}
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {sortedListings.length === 0 ? (
                                <p className="col-span-full text-center text-gray-500 py-10">No active listings found.</p>
                            ) : (
                                sortedListings.map((listing) => (
                                    <Link href={`/dashboard/marketplace/${listing.id}`} key={listing.id} className="block">
                                        <div className={`bg-white border rounded-lg overflow-hidden transition h-full ${listing.seller.subscription?.status === 'ACTIVE' ? 'ring-2 ring-yellow-400 shadow-md hover:shadow-xl relative' : 'hover:shadow-lg'}`}>
                                            <div className="bg-gray-200 relative">
                                                {listing.seller.subscription?.status === 'ACTIVE' && (
                                                    <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-sm uppercase flex items-center gap-1 z-10">
                                                        <Star size={10} fill="currentColor" /> Premium
                                                    </div>
                                                )}
                                                {listing.imageUrl ? (
                                                    <div className={`w-full relative ${listing.seller.subscription?.status === 'ACTIVE' ? 'h-60' : 'h-48'} bg-gray-100`}>
                                                        <img
                                                            src={listing.imageUrl}
                                                            alt={listing.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className={`w-full ${listing.seller.subscription?.status === 'ACTIVE' ? 'h-60' : 'h-48'} flex items-center justify-center text-gray-400`}>No Image</div>
                                                )}
                                                <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
                                                    <div className="bg-white px-2 py-1 rounded-full text-sm font-bold shadow">
                                                        {listing.discountPrice ? (
                                                            <div className="flex flex-col items-end leading-tight">
                                                                <span className="text-gray-400 line-through text-xs">RM {listing.price}</span>
                                                                <span className="text-red-600">RM {listing.discountPrice}</span>
                                                                {listing.promotionEnd && (
                                                                    <span className="text-[10px] text-red-500 font-normal mt-0.5">Ends {new Date(listing.promotionEnd).toLocaleDateString()}</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span>RM {listing.price}</span>
                                                        )}
                                                    </div>
                                                    {listing.deliveryAvailable && (
                                                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-[10px] font-bold shadow uppercase">
                                                            Delivery
                                                        </div>
                                                    )}
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
                                                <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                                                    by {listing.seller.name}
                                                    {listing.seller.subscription?.status === 'ACTIVE' && (
                                                        <span title="Verified Premium Seller" className="inline-flex items-center justify-center w-3.5 h-3.5 bg-blue-500 text-white rounded-full text-[8px] shadow-sm">
                                                            <Check size={8} strokeWidth={3} />
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-gray-600 line-clamp-2 text-sm">{listing.description}</p>
                                                <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
                                                    <span>{listing.seller.sellerProfile?.city || 'Unknown Location'}</span>
                                                    <span>{new Date(listing.createdAt || Date.now()).toLocaleDateString()}</span>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {listing.minQuantity && listing.minQuantity > 1 && (
                                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border">Min Qty: {listing.minQuantity}</span>
                                                    )}
                                                    {listing.strainType && (
                                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">{listing.strainType}</span>
                                                    )}
                                                    {(listing.thcContent || listing.cbdContent) && (
                                                        <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200">
                                                            {listing.thcContent ? `THC: ${listing.thcContent}%` : ''}
                                                            {listing.thcContent && listing.cbdContent ? ' • ' : ''}
                                                            {listing.cbdContent ? `CBD: ${listing.cbdContent}%` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                                                    {listing.type && <p>Type: <span className="font-medium text-gray-700">{listing.type}</span></p>}
                                                    {listing.flavors && <p>Flavor: <span className="font-medium text-gray-700">{listing.flavors}</span></p>}
                                                    {listing.effects && <p>Effect: <span className="font-medium text-gray-700">{listing.effects}</span></p>}
                                                    {listing.sku && <p>SKU: <span className="font-medium text-gray-700">{listing.sku}</span></p>}
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
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">New Listing</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    className="w-full border rounded p-2"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Price ($) <span className="text-red-500">*</span>
                                </label>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Min Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full border rounded p-2"
                                        value={formData.minQuantity}
                                        onChange={e => setFormData({ ...formData, minQuantity: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.deliveryAvailable}
                                            onChange={e => setFormData({ ...formData, deliveryAvailable: e.target.checked })}
                                            className="w-4 h-4 text-green-600 rounded"
                                        />
                                        <span className="text-sm font-medium">Delivery Available</span>
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-3 pt-2 border-t">
                                <h3 className="text-sm font-semibold text-gray-700">Product Details</h3>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Strain Type</label>
                                    <select
                                        className="w-full border rounded p-2"
                                        value={formData.strainType}
                                        onChange={e => setFormData({ ...formData, strainType: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        <option value="Indica">Indica</option>
                                        <option value="Sativa">Sativa</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Product Type</label>
                                    <select
                                        className="w-full border rounded p-2"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        {PRODUCT_TYPES.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">THC (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            className="w-full border rounded p-2"
                                            value={formData.thcContent}
                                            onChange={e => setFormData({ ...formData, thcContent: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">CBD (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            className="w-full border rounded p-2"
                                            value={formData.cbdContent}
                                            onChange={e => setFormData({ ...formData, cbdContent: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Flavors</label>
                                        <input
                                            className="w-full border rounded p-2"
                                            value={formData.flavors}
                                            onChange={e => setFormData({ ...formData, flavors: e.target.value })}
                                            placeholder="E.g. Citrus, Berry"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Effects</label>
                                        <input
                                            className="w-full border rounded p-2"
                                            value={formData.effects}
                                            onChange={e => setFormData({ ...formData, effects: e.target.value })}
                                            placeholder="E.g. Relaxed, Happy"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">SKU</label>
                                    <input
                                        className="w-full border rounded p-2"
                                        value={formData.sku}
                                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                        placeholder="Optional SKU"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    className="w-full border rounded p-2"
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Image</label>
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/gif, image/webp"
                                    onChange={async (e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            const file = e.target.files[0];

                                            // Validation
                                            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                                            if (!validTypes.includes(file.type)) {
                                                alert("Invalid file type. Please upload JPG, PNG, GIF, or WebP.");
                                                return;
                                            }
                                            if (file.size > 5 * 1024 * 1024) {
                                                alert("File is too large. Maximum size is 5MB.");
                                                return;
                                            }

                                            setSubmitting(true); // Reuse submitting state to show loading
                                            const uploadData = new FormData();
                                            uploadData.append('image', file);

                                            try {
                                                const res = await api.upload('/upload/image', uploadData, token || undefined);
                                                setFormData((prev) => ({ ...prev, imageUrl: res.url }));
                                            } catch (err) {
                                                alert("Failed to upload image");
                                            } finally {
                                                setSubmitting(false);
                                            }
                                        }
                                    }}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-green-50 file:text-green-700
                                        hover:file:bg-green-100"
                                />
                                {formData.imageUrl && (
                                    <div className="mt-2 relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden border">
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Supported: JPG, PNG, GIF (Max 5MB)</p>
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

            {/* Success Modal */}
            {showSuccessMessage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <MapPin size={32} className="text-green-600" />
                            {/* Reusing MapPin for now, but really need Check icon. Importing types at top. */}
                        </div>
                        <h2 className="text-xl font-bold mb-2">Listing Submitted!</h2>
                        <p className="text-gray-600 mb-6">
                            Your listing has been submitted and is pending approval from an admin.
                        </p>
                        <button
                            onClick={() => setShowSuccessMessage(false)}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>

    );
}
