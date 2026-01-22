'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const { token, user } = useAuthStore();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('approve-sellers');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
            router.push('/dashboard');
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        setData([]); // Clear data mostly to avoid confusion
        try {
            let res;
            if (activeTab === 'approve-listings') {
                res = await api.get('/admin/listings?status=PENDING', token || undefined);
            } else {
                let query = '';
                if (activeTab === 'approve-sellers') query = 'role=SELLER&status=PENDING';
                else if (activeTab === 'approve-customers') query = 'role=CUSTOMER&status=PENDING';
                else if (activeTab === 'customers') query = 'role=CUSTOMER';
                else if (activeTab === 'sellers') query = 'role=SELLER';

                res = await api.get(`/admin/users?${query}`, token || undefined);
            }

            if (Array.isArray(res)) {
                setData(res);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && activeTab) fetchData();
    }, [token, activeTab]);

    const handleUserStatusUpdate = async (userId: string, newStatus: string) => {
        try {
            await api.put(`/admin/users/${userId}/status`, { status: newStatus }, token || undefined);
            fetchData();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const handleListingStatusUpdate = async (listingId: string, newStatus: string) => {
        try {
            await api.put(`/admin/listings/${listingId}/status`, { status: newStatus }, token || undefined);
            fetchData();
        } catch (err) {
            alert("Failed to update listing status");
        }
    };

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) return null;

    return (
        <div className="container mx-auto py-10 space-y-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="approve-sellers">Approve Sellers</TabsTrigger>
                    <TabsTrigger value="approve-customers">Approve Customers</TabsTrigger>
                    <TabsTrigger value="approve-listings">Approve Listings</TabsTrigger>
                    <TabsTrigger value="customers">All Customers</TabsTrigger>
                    <TabsTrigger value="sellers">All Sellers</TabsTrigger>
                </TabsList>

                <TabsContent value="approve-sellers" className="mt-6">
                    <ApprovalList
                        users={data}
                        title="Pending Seller Approvals"
                        onUpdateStatus={handleUserStatusUpdate}
                        loading={loading}
                    />
                </TabsContent>

                <TabsContent value="approve-customers" className="mt-6">
                    <ApprovalList
                        users={data}
                        title="Pending Customer Approvals"
                        onUpdateStatus={handleUserStatusUpdate}
                        loading={loading}
                    />
                </TabsContent>

                <TabsContent value="approve-listings" className="mt-6">
                    <ListingApprovalList
                        listings={data}
                        onUpdateStatus={handleListingStatusUpdate}
                        loading={loading}
                    />
                </TabsContent>

                <TabsContent value="customers" className="mt-6">
                    <UserList
                        users={data}
                        roleFilter="CUSTOMER"
                        onUpdateStatus={handleUserStatusUpdate}
                    />
                </TabsContent>

                <TabsContent value="sellers" className="mt-6">
                    <UserList
                        users={data}
                        roleFilter="SELLER"
                        onUpdateStatus={handleUserStatusUpdate}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Helper Component for User Approvals
function ApprovalList({ users, title, onUpdateStatus, loading }: any) {
    if (loading) return <p>Loading...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {users.length === 0 && <p>No pending approvals found.</p>}
                    {users.map((u: any) => (
                        <div key={u.id} className="border p-4 rounded flex justify-between items-center bg-yellow-50">
                            <div>
                                <p className="font-bold">{u.name} ({u.role})</p>
                                <p className="text-sm text-gray-500">{u.email}</p>
                                {u.role === 'SELLER' && u.sellerProfile && (
                                    <p className="text-xs text-gray-600">Location: {u.sellerProfile.city}, {u.sellerProfile.country}</p>
                                )}
                                <p className="text-xs text-gray-400">Signed up: {new Date(u.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => onUpdateStatus(u.id, 'ACTIVE')} className="bg-green-600 hover:bg-green-700">Approve</Button>
                                <Button onClick={() => onUpdateStatus(u.id, 'REJECTED')} variant="destructive">Reject</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// Helper Component for Listing Approvals
function ListingApprovalList({ listings, onUpdateStatus, loading }: any) {
    if (loading) return <p>Loading...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Listing Approvals</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {listings.length === 0 && <p>No pending listings found.</p>}
                    {listings.map((l: any) => (
                        <div key={l.id} className="border p-4 rounded flex justify-between items-center bg-blue-50">
                            <div>
                                <p className="font-bold">{l.title}</p>
                                <p className="text-sm">{l.description.substring(0, 50)}...</p>
                                <p className="text-sm font-semibold mt-1">Price: ${l.price}</p>
                                <p className="text-xs text-gray-500 mt-1">Seller: {l.seller?.name || 'Unknown'}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => onUpdateStatus(l.id, 'ACTIVE')} className="bg-green-600 hover:bg-green-700">Approve</Button>
                                <Button onClick={() => onUpdateStatus(l.id, 'REJECTED')} variant="destructive">Reject</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// Helper Component for List
function UserList({ users, roleFilter, onUpdateStatus }: any) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{roleFilter === 'CUSTOMER' ? 'Customers' : 'Sellers'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {users.length === 0 && <p>No users found.</p>}
                    {users.map((u: any) => (
                        <div key={u.id} className="border p-4 rounded flex justify-between items-center">
                            <div>
                                <p className="font-bold flex items-center gap-2">
                                    {u.name}
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {u.status}
                                    </span>
                                </p>
                                <p className="text-sm text-gray-500">{u.email}</p>
                            </div>
                            <div className="flex gap-2">
                                {u.status === 'ACTIVE' ? (
                                    <Button onClick={() => onUpdateStatus(u.id, 'SUSPENDED')} variant="outline" size="sm">Suspend</Button>
                                ) : (
                                    <Button onClick={() => onUpdateStatus(u.id, 'ACTIVE')} variant="outline" size="sm" className="text-green-600 border-green-600">Re-Activate</Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

