'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED

    const { token } = useAuthStore();

    // Approval Modal
    const [approvingBanner, setApprovingBanner] = useState<any>(null);
    const [startDate, setStartDate] = useState('');

    const fetchBanners = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await api.get(`/banners?status=${statusFilter}`, token);
            setBanners(res || []);
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
    }, [statusFilter, token]);

    const handleApproveClick = (banner: any) => {
        setApprovingBanner(banner);
        // Default to today
        setStartDate(new Date().toISOString().split('T')[0]);
    };

    const confirmApprove = async () => {
        if (!startDate || !token) return;
        try {
            await api.put(`/banners/${approvingBanner.id}/approve`, { startDate }, token);
            setApprovingBanner(null);
            fetchBanners();
        } catch (err) {
            console.error(err);
            alert('Error approving banner');
        }
    };

    const handleReject = async (id: string) => {
        if (!token) return;
        if (!confirm('Reject this banner?')) return;
        try {
            await api.put(`/banners/${id}/reject`, {}, token);
            fetchBanners();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Banner Management</h1>

            {/* Tabs */}
            <div className="flex gap-4 border-b mb-6">
                {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`pb-2 px-4 font-medium ${statusFilter === status ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? <p>Loading...</p> : (
                <div className="space-y-4">
                    {banners.length === 0 && <p className="text-gray-500">No banners found with status {statusFilter}.</p>}
                    {banners.map(banner => (
                        <div key={banner.id} className="bg-white p-4 rounded shadow border flex gap-4">
                            <div className="w-48 h-24 bg-gray-100 rounded overflow-hidden shrink-0">
                                <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${banner.imageUrl}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{banner.title || "No Title"}</h3>
                                        <p className="text-sm text-gray-600">Seller: {banner.seller.name} ({banner.seller.email})</p>
                                        <p className="text-sm text-gray-600">Listing: {banner.listing.title}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-mono text-gray-400">Created: {new Date(banner.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Dates if Approved */}
                                {banner.status === 'APPROVED' && (
                                    <div className="mt-2 bg-green-50 text-green-800 p-2 rounded text-sm inline-block">
                                        <strong>Schedule:</strong> {new Date(banner.startDate).toDateString()} - {new Date(banner.endDate).toDateString()}
                                    </div>
                                )}

                                {/* Actions */}
                                {banner.status === 'PENDING' && (
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => handleApproveClick(banner)}
                                            className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700"
                                        >
                                            Approve & Schedule
                                        </button>
                                        <button
                                            onClick={() => handleReject(banner.id)}
                                            className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Approval Modal */}
            {approvingBanner && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="font-bold text-lg mb-4">Approve Banner</h3>
                        <p className="mb-4 text-sm text-gray-600">Select the start date. The banner will run for 7 days from this date.</p>

                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <input
                            type="date"
                            className="w-full border rounded p-2 mb-6"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setApprovingBanner(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmApprove}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Confirm Approval
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
