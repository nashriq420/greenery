'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SellerProfilePage() {
    const params = useParams();
    const id = params?.id as string;
    const { token, user } = useAuthStore();

    const [seller, setSeller] = useState<any>(null);
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || !token) return;

        const fetchData = async () => {
            try {
                // Fetch Seller Profile (Public info mostly)
                // We might need a specific endpoint for this, but for now reuse getSellers or similar 
                // OR add a specific endpoint. 
                // Let's assume we can get user info via a public endpoint or generic user fetch.
                // Since we don't have a specific "get seller by id" endpoint in the provided snippets,
                // we'll mock the fetch or assume one exists. 
                // Wait, we need to check backend routes. 
                // Checking `marketplace.routes.ts`: `router.get('/sellers', ...)` gets nearby.
                // We might need to implement `GET /sellers/:id` on backend or filter.

                // For this step, I'll implement the UI assuming the data comes from a new endpoint 
                // or I'll implement the endpoint in the next step if I fail here.
                // Actually, let's implement the UI and then if it fails, I'll fix the backend.

                // Temporary: fetch all listings and filter by sellerId (inefficient but works for now)
                const allListings = await api.get('/marketplace/listings', token);
                if (Array.isArray(allListings)) {
                    const sellerListings = allListings.filter((l: any) => l.seller.id === id);
                    setListings(sellerListings);

                    if (sellerListings.length > 0) {
                        setSeller(sellerListings[0].seller);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, token]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (!seller && listings.length === 0) return <div className="p-8">Seller not found or has no active listings.</div>;

    return (
        <div className="space-y-8">
            <div className="bg-card text-card-foreground p-8 rounded-lg shadow border">
                <h1 className="text-3xl font-bold mb-2">{seller?.name || 'Seller'}</h1>
                <p className="text-muted-foreground mb-4">{seller?.sellerProfile?.city}, {seller?.sellerProfile?.state}</p>
                <div className="flex gap-4">
                    {user?.id !== id && (
                        <button
                            onClick={async () => {
                                if (!token) return alert('Please login to chat');
                                try {
                                    const chat = await api.post('/chat', { participantId: id }, token);
                                    // Redirect to chat
                                    window.location.href = `/dashboard/chat/${chat.id}`;
                                } catch (e) {
                                    alert('Failed to start chat');
                                }
                            }}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
                        >
                            Chat with {seller?.name?.split(' ')[0]}
                        </button>
                    )}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">Active Listings</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                        <Link href={`/dashboard/marketplace/${listing.id}`} key={listing.id} className="block">
                            <div className="bg-card text-card-foreground border rounded-lg overflow-hidden flex flex-col hover:shadow-lg transition">
                                <div className="h-48 bg-muted flex items-center justify-center relative">
                                    {listing.imageUrl ? <img src={listing.imageUrl} className="w-full h-full object-cover" /> : 'No Image'}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold">{listing.title}</h3>
                                    <p className="text-green-600 font-bold dark:text-green-400">${listing.price}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
