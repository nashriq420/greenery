'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import Link from 'next/link';

// I'll fetch directly or use a hook. existing useMarketplace might need update.
// For now, I'll implement fetch logic here for speed, or update hook later.

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    reply: string | null;
    repliedAt: string | null;
    customer: {
        id: string;
        name: string;
    };
    createdAt: string;
}

interface ListingDetails {
    id: string;
    title: string;
    description: string;
    price: string;
    imageUrl: string | null;
    discountPrice?: string | number | null;
    promotionStart?: string | Date | null;
    promotionEnd?: string | Date | null;
    deliveryAvailable?: boolean;
    minQuantity?: number;
    strainType?: string | null;
    thcContent?: number | null;
    cbdContent?: number | null;
    sellerId: string;
    seller: {
        id: string;
        name: string;
        sellerProfile: {
            city: string | null;
            state: string | null;
            description: string | null;
        } | null;
    } | null;
    reviews: Review[];

    // New Fields
    type?: string | null;
    flavors?: string | null;
    effects?: string | null;
    sku?: string | null;
}

export default function ListingDetailsPage() {
    const { id } = useParams();
    const { token, user } = useAuthStore();
    const [listing, setListing] = useState<ListingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [startingChat, setStartingChat] = useState(false);
    const router = useRouter();

    // Review Form State
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // Reply State
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [submittingReply, setSubmittingReply] = useState(false);

    useEffect(() => {
        fetchListing();
    }, [id, token]);

    const fetchListing = async () => {
        try {
            const data = await api.get(`/marketplace/listings/${id}`, token || undefined);
            setListing(data);
        } catch (err: any) {
            console.error('Fetch listing error:', err);
            setError(err.message || 'Could not load listing details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setSubmittingReview(true);
        try {
            await api.post('/reviews', { listingId: id, rating, comment }, token);
            // Reload
            fetchListing();
            setComment('');
            setRating(5);
        } catch (err: any) {
            alert(err.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleReply = async (reviewId: string) => {
        if (!replyText.trim() || !token) return;
        setSubmittingReply(true);
        try {
            await api.post(`/reviews/${reviewId}/reply`, { reply: replyText }, token);
            fetchListing();
            setReplyingTo(null);
            setReplyText('');
        } catch (err: any) {
            alert(err.message || 'Failed to reply');
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleChat = async () => {
        if (!token) {
            router.push('/login');
            return;
        }
        if (!listing) return;
        setStartingChat(true);
        try {
            const chat = await api.post('/chat', { participantId: listing.sellerId }, token);
            router.push(`/dashboard/chat/${chat.id}`);
        } catch (err: any) {
            alert(err.message || 'Failed to start chat');
            setStartingChat(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error || !listing) return <div className="p-8 text-center text-red-500">{error || 'Listing not found'}</div>;

    const isSeller = user?.role === 'SELLER';
    const isOwner = isSeller && user?.id === listing.sellerId;
    const isCustomer = user?.role === 'CUSTOMER';

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <button
                onClick={() => router.back()}
                className="text-green-600 hover:underline flex items-center gap-1 mb-4"
            >
                &larr; Back
            </button>

            <div className="bg-card text-card-foreground rounded-lg shadow border border-border overflow-hidden">
                <div className="h-64 bg-muted border-b border-border relative">
                    {listing.imageUrl ? (
                        <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                    )}
                </div>
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{listing.title}</h1>
                            <p className="text-muted-foreground">
                                by <Link href={`/dashboard/seller/${listing.sellerId}`} className="hover:text-green-600 dark:hover:text-green-400 hover:underline">{listing.seller?.name || 'Unknown Seller'}</Link>
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {listing.discountPrice ? (
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">RM {listing.discountPrice}</div>
                                    <div className="text-sm text-muted-foreground line-through">RM {listing.price}</div>
                                    {listing.promotionEnd && (
                                        <div className="text-xs text-red-500 dark:text-red-400 font-medium mt-1">
                                            Ends {new Date(listing.promotionEnd).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-2xl font-bold text-green-700 dark:text-green-400">RM {listing.price}</div>
                            )}
                            {!isOwner && (
                                <button
                                    onClick={handleChat}
                                    disabled={startingChat}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                                >
                                    {startingChat ? 'Starting Chat...' : 'Chat with Seller'}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {listing.deliveryAvailable && (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm px-3 py-1 rounded-full font-semibold border border-green-200 dark:border-green-900/50">Delivery Available</span>
                        )}
                        {listing.minQuantity && listing.minQuantity > 1 && (
                            <span className="bg-muted text-muted-foreground text-sm px-3 py-1 rounded-full font-semibold border border-border">Min Qty: {listing.minQuantity}</span>
                        )}
                        {listing.strainType && (
                            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 text-sm px-3 py-1 rounded-full font-semibold border border-purple-200 dark:border-purple-900/50">{listing.strainType}</span>
                        )}
                        {(listing.thcContent || listing.cbdContent) && (
                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-sm px-3 py-1 rounded-full font-semibold border border-blue-100 dark:border-blue-900/50">
                                {listing.thcContent ? `THC: ${listing.thcContent}%` : ''}
                                {listing.thcContent && listing.cbdContent ? ' • ' : ''}
                                {listing.cbdContent ? `CBD: ${listing.cbdContent}%` : ''}
                            </span>
                        )}
                    </div>
                    <div className="mt-4 text-sm text-foreground bg-muted/30 p-4 rounded-lg border border-border space-y-2">
                        {listing.type && (
                            <div className="flex">
                                <span className="font-semibold w-24 text-foreground">Type:</span>
                                <span>{listing.type}</span>
                            </div>
                        )}
                        {listing.flavors && (
                            <div className="flex">
                                <span className="font-semibold w-24 text-foreground">Flavor:</span>
                                <span>{listing.flavors}</span>
                            </div>
                        )}
                        {listing.effects && (
                            <div className="flex">
                                <span className="font-semibold w-24 text-foreground">Effect:</span>
                                <span>{listing.effects}</span>
                            </div>
                        )}
                        {listing.sku && (
                            <div className="flex">
                                <span className="font-semibold w-24 text-foreground">SKU:</span>
                                <span>{listing.sku}</span>
                            </div>
                        )}
                    </div>
                    <p className="mt-6 text-foreground whitespace-pre-line">{listing.description}</p>
                    <div className="mt-6 text-sm text-muted-foreground">
                        {listing.seller?.sellerProfile?.city}, {listing.seller?.sellerProfile?.state}
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">Reviews</h2>

                {/* Review Form */}
                {isCustomer && (
                    <div className="bg-card text-card-foreground p-6 rounded-lg shadow border border-border">
                        <h3 className="font-bold mb-4">Leave a Review</h3>
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className={`text-2xl ${star <= rating ? 'text-yellow-400 dark:text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Comment</label>
                                <textarea
                                    className="w-full border rounded p-2"
                                    rows={3}
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Share your experience..."
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submittingReview}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                            >
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                    {listing.reviews.length === 0 ? (
                        <p className="text-muted-foreground italic">No reviews yet.</p>
                    ) : (
                        listing.reviews.map(review => (
                            <div key={review.id} className="bg-card text-card-foreground p-6 rounded-lg shadow border border-border">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold">{review.customer.name}</span>
                                    <span className="text-sm text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-yellow-400 dark:text-yellow-500 text-sm mb-2">
                                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                </div>
                                <p className="text-foreground mb-4">{review.comment}</p>

                                {/* Seller Reply Display */}
                                {review.reply && (
                                    <div className="bg-muted/30 p-4 rounded-lg mt-4 border-l-4 border-green-500">
                                        <p className="text-sm font-bold text-green-700 dark:text-green-500 mb-1">Seller Response</p>
                                        <p className="text-foreground text-sm">{review.reply}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{new Date(review.repliedAt!).toLocaleDateString()}</p>
                                    </div>
                                )}

                                {/* Seller Reply Form */}
                                {isOwner && !review.reply && (
                                    <div className="mt-4">
                                        {replyingTo === review.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    className="w-full border rounded p-2 text-sm"
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                    placeholder="Write a reply..."
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleReply(review.id)}
                                                        disabled={submittingReply}
                                                        className="text-white bg-green-600 px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        Post Reply
                                                    </button>
                                                    <button
                                                        onClick={() => setReplyingTo(null)}
                                                        className="text-muted-foreground px-3 py-1 text-sm hover:text-foreground hover:underline"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setReplyingTo(review.id); setReplyText(''); }}
                                                className="text-green-600 text-sm hover:underline"
                                            >
                                                Reply to Review
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div >
    );
}
