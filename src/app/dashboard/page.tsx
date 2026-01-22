'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMyListings } from '@/hooks/useMarketplace';
import { useEffect } from 'react';

const MapComponent = dynamic(() => import('@/components/Map'), { ssr: false });

export default function DashboardPage() {
    const { user, refreshUser } = useAuthStore();
    const { listings, loading } = useMyListings();

    // Refresh user data on mount to get latest location/subscription status
    useEffect(() => {
        refreshUser?.(); // Optional chain in case store isn't updated instantly? Typescript safeguards.
        // Actually since we defined it, it should be there. 
        // But for safety:
        if (refreshUser) refreshUser();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {user?.role === 'SELLER' && (
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h3 className="font-bold text-lg mb-2">My Location</h3>
                        {user.sellerProfile ? (
                            <div>
                                <p className="text-gray-700">{user.sellerProfile.address}</p>
                                <p className="text-gray-500">{user.sellerProfile.city}, {user.sellerProfile.country}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">Location not set</p>
                        )}
                    </div>
                )}

                {user?.role === 'SELLER' && (
                    <div className="bg-white p-6 rounded-lg shadow border h-full">
                        <h3 className="font-bold text-lg mb-4">Active Listings</h3>
                        {loading ? <p>Loading...</p> : (
                            listings.length > 0 ? (
                                <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {listings.map((listing) => (
                                        <div key={listing.id} className="flex gap-3 items-center border-b pb-2 last:border-0 last:pb-0">
                                            <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                                                {listing.imageUrl ? <img src={listing.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">No Img</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{listing.title}</p>
                                                <p className="text-xs text-green-600 font-bold">${listing.price}</p>
                                            </div>
                                            <Link href={`/dashboard/seller/${user.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No active listings.</p>
                            )
                        )}
                    </div>
                )}

                <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="font-bold text-lg mb-2">Subscription</h3>
                    <p className="text-gray-500">Status: <span className={`font-medium ${user?.subscription?.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {user?.subscription?.status || 'Free Use'}
                    </span></p>
                    <p className="text-sm text-gray-500 mt-1">Listings: {user?._count?.listings || 0}</p>
                    <div className="mt-4">
                        <Link href="/dashboard/subscription" className="text-sm text-blue-600 hover:underline">Manage Subscription</Link>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border md:col-span-3">
                    <h3 className="font-bold text-lg mb-4">Nearby Sellers</h3>
                    <MapComponent />
                </div>


            </div>
        </div>
    );
}
