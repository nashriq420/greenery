'use client';


import { useState, useEffect } from 'react';
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
    const [profile, setProfile] = useState<UserProfile>({ name: '', email: '', role: '' });
    const [sellerProfile, setSellerProfile] = useState<SellerProfile>({
        lat: 0, lng: 0, address: '', city: '', state: '', country: '', description: ''
    });
    const [myListings, setMyListings] = useState<Listing[]>([]);
    const [newListing, setNewListing] = useState({ title: '', description: '', price: '', imageUrl: '' });
    const [editingListing, setEditingListing] = useState<Listing | null>(null);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [loading, setLoading] = useState(false);

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
                setProfile({ name: res.name || '', email: res.email || '', role: res.role || '' });
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
            await api.put('/user/me', { name: profile.name }, token || undefined);

            // Update local auth store
            if (user && token) {
                useAuthStore.getState().login({ ...user, name: profile.name }, token);
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
                        <TabsTrigger value="listings">My Listings</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                />
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
            </Tabs>
        </div>
    );
}
