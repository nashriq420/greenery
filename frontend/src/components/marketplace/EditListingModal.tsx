import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Listing } from '@/hooks/useMarketplace';

interface EditListingModalProps {
    listing: Listing | null;
    onClose: () => void;
    onUpdate: () => void;
}

export default function EditListingModal({ listing, onClose, onUpdate }: EditListingModalProps) {
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        imageUrl: '' // Keep this for existing or manually entered URLs
    });

    useEffect(() => {
        if (listing) {
            setFormData({
                title: listing.title,
                description: listing.description,
                price: listing.price,
                imageUrl: listing.imageUrl || ''
            });
            setPreviewUrl(listing.imageUrl || '');
        }
    }, [listing]);

    if (!listing) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            // Create local preview
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let finalImageUrl = formData.imageUrl;

            // Upload image if file selected
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('image', selectedFile);

                const uploadRes = await api.upload('/upload/image', uploadData, token!);
                if (uploadRes.url) {
                    finalImageUrl = uploadRes.url;
                }
            }

            await api.put(`/marketplace/listings/${listing.id}`, {
                ...formData,
                price: parseFloat(formData.price),
                imageUrl: finalImageUrl
            }, token!);

            onUpdate();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update listing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4 pointer-events-none">
            {/* Invisible backdrop to position center, allowing clicks through if needed? 
                 User said "without changing background", usually implies no dimming. 
                 But we likely still want to block clicks or just show it floating. 
                 I'll make the container pointer-events-none so interaction with background is possible if intended,
                 OR if they just meant "visual" background. 
                 Usually modals block interaction. I'll just remove the visual bg color. 
             */}
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-200 pointer-events-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Edit Listing</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="mt-1 w-full border rounded p-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            required
                            step="0.01"
                            min="0"
                            className="mt-1 w-full border rounded p-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={3}
                            className="mt-1 w-full border rounded p-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Image</label>

                        {previewUrl && (
                            <div className="mb-2 h-32 w-full bg-gray-100 rounded overflow-hidden relative group">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
