import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Listing } from '@/hooks/useMarketplace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Save } from 'lucide-react';

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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        imageUrl: ''
    });

    useEffect(() => {
        if (listing) {
            setFormData({
                title: listing.title,
                description: listing.description || '',
                price: listing.price.toString(),
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
        <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-card text-card-foreground rounded-xl p-6 w-full max-w-lg shadow-2xl border animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Edit Listing</h2>
                        <p className="text-sm text-muted-foreground">Make changes to your listing details.</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm font-medium flex items-center gap-2">
                        <X className="w-4 h-4" /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Listing title"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price ($)</Label>
                            <Input
                                id="price"
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            placeholder="Describe your item..."
                            className="resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Listing Image</Label>
                        <div className="flex items-start gap-4">
                            <div className="relative w-24 h-24 bg-muted rounded-lg border overflow-hidden shrink-0 shadow-sm group">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                                        <Upload className="w-8 h-8 opacity-20" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="flex flex-col gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-fit"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {previewUrl ? 'Change Image' : 'Upload Image'}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Supported formats: JPG, PNG, WebP.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="min-w-[120px]"
                        >
                            {loading ? (
                                <>Saving...</>
                            ) : (
                                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
