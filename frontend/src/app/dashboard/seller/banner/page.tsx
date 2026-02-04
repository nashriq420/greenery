'use client';

import { useState, useEffect } from 'react';
import { useMyListings } from '@/hooks/useMarketplace';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function SellerBannerPage() {
    const { listings, loading: listingsLoading } = useMyListings();
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const { token } = useAuthStore();

    // Form State
    const [selectedListing, setSelectedListing] = useState('');
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');

    const fetchBanners = async () => {
        if (!token) return;
        try {
            const res = await api.get('/banners', token);
            setBanners(res); // api returns parsed json
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchBanners();
        }
    }, [token]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedListing || !file) {
            setMessage('Please select a listing and an image.');
            return;
        }
        if (!token) return;

        const formData = new FormData();
        formData.append('listingId', selectedListing);
        formData.append('image', file);
        if (title) formData.append('title', title);

        setUploading(true);
        setMessage('');

        try {
            await api.upload('/banners/upload', formData, token);
            setMessage('Banner uploaded successfully! Waiting for approval.');
            setSelectedListing('');
            setTitle('');
            setFile(null);
            fetchBanners(); // Refresh list
        } catch (err: any) {
            setMessage(err.message || 'Error uploading banner');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Promote Your Products</h1>

            {/* Upload Section */}
            <div className="bg-white p-6 rounded-lg shadow border mb-8">
                <h2 className="text-lg font-semibold mb-4">Request "Product of the Week" Banner</h2>
                <div className="bg-blue-50 text-blue-800 p-4 rounded mb-4 text-sm">
                    <p className="font-bold">Instructions:</p>
                    <ul className="list-disc ml-5 mt-1">
                        <li>Banner size recommendation: <strong>1200x200 pixels</strong>.</li>
                        <li>High quality images look best.</li>
                        <li>Approved banners run for 7 days.</li>
                        <li>Queue system applies if dates are booked.</li>
                    </ul>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Listing to Promote *</label>
                        <select
                            className="w-full border rounded p-2"
                            value={selectedListing}
                            onChange={(e) => setSelectedListing(e.target.value)}
                            required
                        >
                            <option value="">-- Select Listing --</option>
                            {listings.map(l => (
                                <option key={l.id} value={l.id}>{l.title} (${l.price})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Custom Title (Optional)</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2"
                            placeholder='e.g., "Special Harvest Sale"'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Banner Image *</label>
                        <div className="flex items-center gap-3">
                            <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500">
                                <span className="text-sm font-medium">Choose File</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    required={!file} // Only required if no file selected yet
                                />
                            </label>
                            <span className="text-sm text-gray-500 italic">
                                {file ? file.name : 'No file chosen'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Recommended: 1200x200px</p>
                    </div>

                    {message && <p className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

                    <button
                        type="submit"
                        disabled={uploading || listingsLoading}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {uploading ? 'Uploading...' : 'Submit Request'}
                    </button>
                </form>
            </div >

            {/* My Banners List */}
            < div >
                <h2 className="text-lg font-semibold mb-4">My Banner Requests</h2>
                {
                    loading ? <p>Loading...</p> : (
                        banners && banners.length > 0 ? (
                            <div className="space-y-4">
                                {banners.map((banner) => (
                                    <div key={banner.id} className="bg-white border rounded-lg p-4 flex gap-4 items-center">
                                        <div className="w-32 h-16 bg-gray-100 rounded overflow-hidden shrink-0">
                                            <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${banner.imageUrl}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold">{banner.title || "No Title"}</h3>
                                            <p className="text-sm text-gray-600">Listing: {banner.listing?.title}</p>
                                            <div className="flex gap-2 mt-1 text-xs">
                                                <span className={`px-2 py-0.5 rounded-full font-bold ${banner.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                    banner.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {banner.status}
                                                </span>
                                                {banner.startDate && (
                                                    <span className="text-gray-500">
                                                        Running: {new Date(banner.startDate).toLocaleDateString()} - {new Date(banner.endDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No banner requests yet.</p>
                        )
                    )
                }
            </div >
        </div >
    );
}
