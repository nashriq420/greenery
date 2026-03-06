'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMyListings, Listing } from '@/hooks/useMarketplace';
import { useEffect, useState } from 'react';
import EditListingModal from '@/components/marketplace/EditListingModal';
import ViewListingModal from '@/components/marketplace/ViewListingModal';

const MapComponent = dynamic(() => import('@/components/Map'), { ssr: false });

export default function DashboardPage() {
    const { user, refreshUser } = useAuthStore();
    const router = useRouter();
    const { listings, loading, refetch } = useMyListings();
    const [editingListing, setEditingListing] = useState<Listing | null>(null);
    const [viewingListing, setViewingListing] = useState<Listing | null>(null);

    // Refresh user data on mount to get latest location/subscription status
    useEffect(() => {
        if (refreshUser) refreshUser();
    }, [refreshUser]);

    // Redirect Admin to Admin Dashboard
    useEffect(() => {
        if (user?.role === 'ADMIN') {
            router.push('/dashboard/admin');
        }
    }, [user, router]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {user?.role === 'SELLER' && (
                    <div className="bg-card p-6 rounded-lg shadow border border-border text-card-foreground">
                        <h3 className="font-bold text-lg mb-2 text-foreground">My Location</h3>
                        {user.sellerProfile ? (
                            <div>
                                <p className="text-foreground">{user.sellerProfile.address}</p>
                                <p className="text-muted-foreground">{user.sellerProfile.city}, {user.sellerProfile.country}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Location not set</p>
                        )}
                    </div>
                )}

                {user?.role === 'SELLER' && (
                    <div className="bg-card p-6 rounded-lg shadow border border-border h-full text-card-foreground">
                        <h3 className="font-bold text-lg mb-4 text-foreground">My Listings</h3>
                        {loading ? <p>Loading...</p> : (
                            listings.length > 0 ? (
                                <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {listings.map((listing) => (
                                        <div key={listing.id} className="flex gap-3 items-center border-b border-border pb-2 last:border-0 last:pb-0">
                                            <div className="w-12 h-12 shrink-0 bg-muted rounded overflow-hidden">
                                                {listing.imageUrl ? <img src={listing.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No Img</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center pr-2">
                                                    <p className="font-medium text-sm truncate mr-2 text-foreground">{listing.title}</p>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${listing.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                        listing.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                            listing.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>{listing.status}</span>
                                                </div>
                                                <p className="text-xs text-green-600 font-bold">${listing.price}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setViewingListing(listing)}
                                                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => setEditingListing(listing)}
                                                    className="px-3 py-1 text-xs font-medium text-foreground bg-muted border border-border rounded hover:bg-muted/80 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No active listings.</p>
                            )
                        )}
                    </div>
                )}

                <div className="bg-card p-6 rounded-lg shadow border border-border md:col-span-3 text-card-foreground">
                    <h3 className="font-bold text-lg mb-4 text-foreground">Nearby Sellers</h3>
                    <MapComponent />
                </div>


            </div>

            {editingListing && (
                <EditListingModal
                    listing={editingListing}
                    onClose={() => setEditingListing(null)}
                    onUpdate={refetch}
                />
            )}

            {viewingListing && (
                <ViewListingModal
                    listing={viewingListing}
                    onClose={() => setViewingListing(null)}
                />
            )}
        </div>
    );
}
