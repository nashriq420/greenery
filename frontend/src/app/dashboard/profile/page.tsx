'use client';


import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import EditListingModal from '@/components/marketplace/EditListingModal';
import { Listing } from '@/hooks/useMarketplace';

interface UserProfile {
    name: string;
    email: string;
    username: string;
    profilePicture?: string;
    role: string;
}

interface SellerProfile {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
    country: string;
    description: string;
}

// Listing interface removed, using imported one

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-md flex items-center justify-center">Loading Map...</div>
});

export default function ProfilePage() {
    const { user, token } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile>({
        name: '', email: '', username: '', role: '', profilePicture: ''
    });
    const [sellerProfile, setSellerProfile] = useState<SellerProfile>({
        lat: 0, lng: 0, address: '', city: '', state: '', country: '', description: ''
    });
    const [myListings, setMyListings] = useState<Listing[]>([]);
    const [newListing, setNewListing] = useState({ title: '', description: '', price: '', imageUrl: '' });
    const [editingListing, setEditingListing] = useState<Listing | null>(null);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (token) {
            fetchProfile();
        }
    }, [token]);

    useEffect(() => {
        if (token && user?.role === 'SELLER') {
            fetchMyListings();
        }
    }, [token, user]);
    const fetchProfile = async () => {
        try {
            const res = await api.get('/user/me', token || undefined);
            if (res) {
                setProfile({
                    name: res.name || '',
                    email: res.email || '',
                    username: res.username || '',
                    profilePicture: res.profilePicture || '',
                    role: res.role || ''
                });
                if (res.sellerProfile) {
                    setSellerProfile({
                        lat: res.sellerProfile.latitude,
                        lng: res.sellerProfile.longitude,
                        address: res.sellerProfile.address || '',
                        city: res.sellerProfile.city || '',
                        state: res.sellerProfile.state || '',
                        country: res.sellerProfile.country || '',
                        description: res.sellerProfile.description || ''
                    });
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMyListings = async () => {
        try {
            const res = await api.get('/marketplace/my-listings', token || undefined);
            if (Array.isArray(res)) {
                setMyListings(res);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const payload = {
                name: profile.name,
                username: profile.username,
                profilePicture: profile.profilePicture
            };

            await api.put('/user/me', payload, token || undefined);

            // Update local auth store
            if (user && token) {
                useAuthStore.getState().login({
                    ...user,
                    name: profile.name,
                    username: profile.username,
                    profilePicture: profile.profilePicture
                }, token);
            }

            alert("Profile updated");
        } catch (err) {
            alert("Failed to update profile");
        }
    };

    const handleUpdatePassword = async () => {
        if (!passwordData.newPassword || !passwordData.currentPassword) {
            alert(passwordData.newPassword ? "Please enter current password" : "Please enter new password");
            return;
        }
        try {
            await api.put('/user/me/password', passwordData, token || undefined);
            alert("Password updated");
            setPasswordData({ currentPassword: '', newPassword: '' });
        } catch (err: any) { // Type as any for simple error handling
            const msg = err?.message || "Failed to update password";
            alert(msg);
        }
    };

    const handleUpdateLocation = async () => {
        try {
            await api.put('/user/me/location', sellerProfile, token || undefined);

            // Refresh user data in store to reflect changes in dashboard
            const { refreshUser } = useAuthStore.getState();
            if (refreshUser) {
                await refreshUser();
            }

            alert("Location updated");
        } catch (err) {
            alert("Failed to update location");
        }
    };

    const handleCreateListing = async () => {
        try {
            setLoading(true);
            await api.post('/marketplace/listings', {
                title: newListing.title,
                description: newListing.description,
                price: parseFloat(newListing.price) || 0,
                imageUrl: newListing.imageUrl || undefined
            }, token || undefined);
            alert("Listing created");
            fetchMyListings();
            setNewListing({ title: '', description: '', price: '', imageUrl: '' });
        } catch (err: any) {
            alert(err.message || "Failed to create listing");
        } finally {
            setLoading(false);
            // Refresh listing count in dashboard
            const { refreshUser } = useAuthStore.getState();
            if (refreshUser) refreshUser();
        }
    };

    const handleDeleteListing = async (id: string) => {
        try {
            if (!confirm("Are you sure?")) return;
            await api.delete(`/marketplace/listings/${id}`, token || undefined);
            alert("Listing deleted");
            fetchMyListings();
            // Refresh listing count in dashboard
            const { refreshUser } = useAuthStore.getState();
            if (refreshUser) refreshUser();
        } catch (err) {
            alert("Failed to delete listing");
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const formData = new FormData();
            formData.append('image', e.target.files[0]);
            try {
                const res = await api.upload('/upload/image', formData, token || undefined);
                setNewListing({ ...newListing, imageUrl: res.url });
            } catch (err) {
                alert("Failed to upload image");
            }
        }
    };

    if (!user) {
        return <div className="p-10">Please log in to view profile.</div>;
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <h1 className="text-3xl font-bold">Profile Management</h1>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList>
                    <TabsTrigger value="profile">Profile & Location</TabsTrigger>
                    {profile.role === 'SELLER' && (
                        <>
                            <TabsTrigger value="listings">My Listings</TabsTrigger>
                            <TabsTrigger value="promotions">My Promotions</TabsTrigger>
                        </>
                    )}
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Profile Picture</Label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-24 h-24 bg-muted rounded-full border overflow-hidden flex items-center justify-center shrink-0 shadow-sm group ring-2 ring-transparent hover:ring-primary/20 transition-all">
                                        {profile.profilePicture ? (
                                            <img
                                                src={profile.profilePicture}
                                                alt="Profile"
                                                className={`w-full h-full object-cover transition-opacity duration-300 ${uploading ? 'opacity-30 blur-sm' : ''}`}
                                            />
                                        ) : (
                                            <span className="text-4xl text-muted-foreground/30 font-light">?</span>
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
                                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-col gap-2">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/png, image/jpeg, image/gif, image/webp"
                                                onChange={async (e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        const file = e.target.files[0];

                                                        // Client-side Validation
                                                        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                                                        if (!validTypes.includes(file.type)) {
                                                            alert("Invalid file type. Please upload JPG, PNG, GIF, or WebP.");
                                                            return;
                                                        }

                                                        const maxSize = 5 * 1024 * 1024; // 5MB
                                                        if (file.size > maxSize) {
                                                            alert("File is too large. Maximum size is 5MB.");
                                                            return;
                                                        }

                                                        setUploading(true);
                                                        const formData = new FormData();
                                                        formData.append('image', file);
                                                        try {
                                                            const res = await api.upload('/upload/image', formData, token || undefined);
                                                            // Set local state immediately for fast feedback
                                                            setProfile(prev => ({ ...prev, profilePicture: res.url }));
                                                        } catch (err) {
                                                            alert("Failed to upload image");
                                                        } finally {
                                                            setUploading(false);
                                                            // Reset input so same file can be selected again if needed
                                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploading}
                                                >
                                                    {uploading ? 'Uploading...' : 'Change Photo'}
                                                </Button>
                                                {profile.profilePicture && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setProfile({ ...profile, profilePicture: '' })}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                            Supported: JPG, PNG, GIF, WebP (Max 5MB)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input
                                        value={profile.username}
                                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                        placeholder="Username"
                                    />
                                    <p className="text-xs text-yellow-600">
                                        Note: Username can only be changed once every 30 days.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={profile.email} disabled />
                            </div>
                            <Button onClick={handleUpdateProfile}>Update Profile</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Current Password</Label>
                                <Input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                />
                            </div>
                            <Button onClick={handleUpdatePassword} variant="outline">Change Password</Button>
                        </CardContent>
                    </Card>

                    {profile.role === 'SELLER' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Seller Location & Info</CardTitle>
                                <CardDescription>Update your location to be visible on the map.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4 pb-4">
                                    <Label>Location Search & Map</Label>
                                    <LocationPicker
                                        initialLat={sellerProfile.lat || 51.505}
                                        initialLng={sellerProfile.lng || -0.09}
                                        onLocationSelect={(data) => {
                                            setSellerProfile(prev => ({
                                                ...prev,
                                                lat: data.lat,
                                                lng: data.lng,
                                                address: data.address,
                                                city: data.city,
                                                state: data.state,
                                                country: data.country
                                            }));
                                        }}
                                    />
                                    <div className="text-xs text-gray-500 flex gap-4">
                                        <span>Selected Latitude: {sellerProfile.lat.toFixed(6)}</span>
                                        <span>Selected Longitude: {sellerProfile.lng.toFixed(6)}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <Input
                                        value={sellerProfile.address}
                                        onChange={(e) => setSellerProfile({ ...sellerProfile, address: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input
                                            value={sellerProfile.city}
                                            onChange={(e) => setSellerProfile({ ...sellerProfile, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <Input
                                            value={sellerProfile.state}
                                            onChange={(e) => setSellerProfile({ ...sellerProfile, state: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (Visible to buyers)</Label>
                                    <Textarea
                                        value={sellerProfile.description}
                                        onChange={(e) => setSellerProfile({ ...sellerProfile, description: e.target.value })}
                                    />
                                </div>
                                <Button onClick={handleUpdateLocation}>Update Location Info</Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="listings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Listing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={newListing.title}
                                    onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={newListing.description}
                                    onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Price</Label>
                                <Input
                                    type="number"
                                    value={newListing.price}
                                    onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Image (Upload)</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e)}
                                />
                                {newListing.imageUrl && <p className="text-sm text-green-600">Image uploaded successfully!</p>}
                            </div>
                            <Button onClick={handleCreateListing} disabled={loading}>
                                {loading ? 'Creating...' : 'Create Listing'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Your Listings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                {myListings.length === 0 && <p>No listings found.</p>}
                                {myListings.map(listing => (
                                    <div key={listing.id} className="border p-4 rounded bg-white shadow-sm grid grid-cols-[auto_1fr_auto] gap-4 items-center">
                                        {/* Image Column */}
                                        {listing.imageUrl ? (
                                            <div className="w-24 h-24 bg-gray-100 rounded-md border overflow-hidden relative shrink-0">
                                                <img
                                                    src={listing.imageUrl}
                                                    alt={listing.title}
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-24 h-24 bg-gray-100 rounded-md border flex items-center justify-center text-xs text-gray-400 shrink-0">
                                                No Image
                                            </div>
                                        )}

                                        {/* Text Column */}
                                        <div className="min-w-0 pr-4">
                                            <h3 className="font-bold text-lg truncate" title={listing.title}>{listing.title}</h3>
                                            <p className="text-gray-600 font-medium">${listing.price}</p>
                                            <div className="mt-1">
                                                <span className={`inline-block text-xs px-2 py-1 rounded-full font-bold ${listing.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    listing.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                        listing.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {listing.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Column */}
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setEditingListing(listing)}>Edit</Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteListing(listing.id)}>Delete</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {editingListing && (
                        <EditListingModal
                            listing={editingListing}
                            onClose={() => setEditingListing(null)}
                            onUpdate={fetchMyListings}
                        />
                    )}
                </TabsContent>

                {profile.role === 'SELLER' && (
                    <TabsContent value="promotions" className="space-y-6">
                        <BannersTab token={token} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
function BannersTab({ token }: { token: string | null }) {
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        api.get('/banners', token)
            .then(res => setBanners(Array.isArray(res) ? res : []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [token]);

    const pendingBanners = banners.filter(b => b.status === 'PENDING');
    const approvedBanners = banners.filter(b => b.status === 'APPROVED');
    const otherBanners = banners.filter(b => b.status !== 'PENDING' && b.status !== 'APPROVED');

    // Image URL helper (reused logic)
    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;

        let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

        // Remove trailing slash if present
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

        // Handle case where API_URL is just '/api' (proxy)
        if (baseUrl === '/api') baseUrl = 'http://localhost:4000';

        // For uploads, we need the server root, not the API root
        if (path.startsWith('/uploads') && baseUrl.endsWith('/api')) {
            baseUrl = baseUrl.slice(0, -4);
        }

        return `${baseUrl}${path}`;
    };

    if (loading) return <div>Loading promotions...</div>;

    const BannerList = ({ title, list }: { title: string, list: any[] }) => (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-lg">{title} ({list.length})</CardTitle>
            </CardHeader>
            <CardContent>
                {list.length === 0 ? (
                    <p className="text-gray-500 text-sm">No banners in this category.</p>
                ) : (
                    <div className="space-y-4">
                        {list.map(banner => (
                            <div key={banner.id} className="flex gap-4 border p-4 rounded-lg items-center bg-white relative overflow-hidden">
                                <div className="w-32 h-16 bg-gray-100 rounded shrink-0 border overflow-hidden">
                                    <img src={getImageUrl(banner.imageUrl)} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold truncate">{banner.title || "No Title"}</h4>
                                    <p className="text-sm text-gray-500">Listing: {banner.listing?.title}</p>
                                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                        {banner.status === 'APPROVED' && (
                                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">
                                                Runs: {new Date(banner.startDate).toLocaleDateString()} - {new Date(banner.endDate).toLocaleDateString()}
                                            </span>
                                        )}
                                        {banner.status === 'PENDING' && (
                                            <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-medium">
                                                Waiting for Approval
                                            </span>
                                        )}
                                        {banner.status === 'REJECTED' && (
                                            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-medium">
                                                Rejected
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">My Promotional Banners</h2>
                <p className="text-gray-600">Track the status of your "Product of the Week" banner requests.</p>
            </div>

            <BannerList title="Pending Requests" list={pendingBanners} />
            <BannerList title="Approved & Scheduled" list={approvedBanners} />
            {otherBanners.length > 0 && <BannerList title="History / Rejected" list={otherBanners} />}
        </div>
    );
}
