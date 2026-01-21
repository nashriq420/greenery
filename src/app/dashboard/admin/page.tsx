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
    const [activeTab, setActiveTab] = useState('pending');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
            router.push('/dashboard');
        }
    }, [user]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let query = '';
            if (activeTab === 'pending') query = 'status=PENDING';
            else if (activeTab === 'customers') query = 'role=CUSTOMER';
            else if (activeTab === 'sellers') query = 'role=SELLER';

            const res = await api.get(`/admin/users?${query}`, token || undefined);
            if (Array.isArray(res)) {
                setUsers(res);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && activeTab) fetchUsers();
    }, [token, activeTab]);

    const handleStatusUpdate = async (userId: string, newStatus: string) => {
        try {
            await api.put(`/admin/users/${userId}/status`, { status: newStatus }, token || undefined);
            fetchUsers();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) return null;

    return (
        <div className="container mx-auto py-10 space-y-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                    <TabsTrigger value="sellers">Sellers</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending User Approvals</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? <p>Loading...</p> : (
                                <div className="space-y-4">
                                    {users.filter(u => u.status === 'PENDING').length === 0 && <p>No pending approvals.</p>}
                                    {users.filter(u => u.status === 'PENDING').map(u => (
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
                                                <Button onClick={() => handleStatusUpdate(u.id, 'ACTIVE')} className="bg-green-600 hover:bg-green-700">Approve</Button>
                                                <Button onClick={() => handleStatusUpdate(u.id, 'REJECTED')} variant="destructive">Reject</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="customers" className="mt-6">
                    <UserList
                        users={users}
                        roleFilter="CUSTOMER"
                        onUpdateStatus={handleStatusUpdate}
                        fetchTrigger={fetchUsers} // To refresh if we reused this component properly with internal fetching, but here we pass full list. 
                    // Actually, the main fetcher fetches based on activeTab logic which is simple status-based or all. 
                    // Let's improve the fetch logic:
                    />
                    {/* Refactoring fetch logic inside Main component to handle tabs better */}
                </TabsContent>

                <TabsContent value="sellers" className="mt-6">
                    <UserList
                        users={users}
                        roleFilter="SELLER"
                        onUpdateStatus={handleStatusUpdate}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Helper Component
function UserList({ users, roleFilter, onUpdateStatus }: any) {
    // API already filters by role/status based on tab, so 'users' contains correct data for the tab.
    // However, for 'pending' tab logic was specific.
    // For Customer/Seller tabs, we show listing. 

    // Safety check just in case mixed data (though API shouldn't return mixed if filtered)
    const displayUsers = users;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{roleFilter === 'CUSTOMER' ? 'Customers' : 'Sellers'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {displayUsers.length === 0 && <p>No users found.</p>}
                    {displayUsers.map((u: any) => (
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
