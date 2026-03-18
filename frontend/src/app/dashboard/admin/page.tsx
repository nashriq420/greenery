'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import ActivityLogs from '@/components/admin/ActivityLogs';
import { useAuthStore } from '@/store/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
// import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import BlacklistManagement from '@/components/admin/BlacklistManagement';

// Types
type User = {
    id: string;
    name: string;
    email: string;
    role: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPERADMIN';
    status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
    createdAt: string;
    sellerProfile?: {
        city: string;
        country: string;
    };
}

type Listing = {
    id: string;
    title: string;
    description: string;
    price: number;
    status: 'PENDING' | 'ACTIVE' | 'SOLD' | 'REJECTED';
    seller: {
        id: string;
        name: string;
        email: string;
    };
    createdAt: string;
    imageUrl?: string;
    strainType?: string;
    type?: string;
    flavors?: string;
    effects?: string;
    sku?: string;
    thcContent?: number;
    cbdContent?: number;
    deliveryAvailable?: boolean;
    minQuantity?: number;
}



export default function AdminPage() {
    const { token, user } = useAuthStore();

    const router = useRouter();

    // ... inside component
    const [mainTab, setMainTab] = useState('customers');
    const [search, setSearch] = useState(''); // Added Search State

    // Data States
    const [customers, setCustomers] = useState<User[]>([]);
    const [sellers, setSellers] = useState<User[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);

    const [loading, setLoading] = useState(true);

    // Warning Modal State
    const [warningOpen, setWarningOpen] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [selectedUserForWarning, setSelectedUserForWarning] = useState<{ userId: string, listingId?: string } | null>(null);

    // View Listing Modal State
    const [viewListingOpen, setViewListingOpen] = useState(false);
    const [selectedListingForView, setSelectedListingForView] = useState<Listing | null>(null);

    const handleViewListing = (listing: Listing) => {
        setSelectedListingForView(listing);
        setViewListingOpen(true);
    };

    const handleWarnUser = (userId: string, listingId?: string) => {
        setSelectedUserForWarning({ userId, listingId });
        setWarningMessage('');
        setWarningOpen(true);
    };

    const submitWarning = async () => {
        if (!selectedUserForWarning || !warningMessage) return;
        try {
            await api.post(`/admin/users/${selectedUserForWarning.userId}/warn`, {
                message: warningMessage,
                listingId: selectedUserForWarning.listingId
            }, token || undefined);
            alert("Warning sent successfully"); // Replaced toast with alert for now as toast setup is unknown
            setWarningOpen(false);
        } catch (e) {
            alert("Failed to send warning");
        }
    };

    useEffect(() => {
        if (user && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
            router.push('/dashboard');
        }
    }, [user, router]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch everything in parallel or smart fetch based on tab?
            // For simplicity and small scale, let's fetch based on group
            if (mainTab === 'customers') {
                const url = `/admin/users?role=CUSTOMER${search ? `&search=${search}` : ''}`;
                const res = await api.get(url, token || undefined);
                if (Array.isArray(res)) setCustomers(res);
            } else if (mainTab === 'sellers') {
                const url = `/admin/users?role=SELLER${search ? `&search=${search}` : ''}`;
                const res = await api.get(url, token || undefined);
                if (Array.isArray(res)) setSellers(res);
            } else if (mainTab === 'listings') {
                const url = `/admin/listings?${search ? `search=${search}` : ''}`;
                const res = await api.get(url, token || undefined);
                if (Array.isArray(res)) setListings(res);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && mainTab) {
            const timeout = setTimeout(fetchData, 500); // Debounce
            return () => clearTimeout(timeout);
        }
    }, [token, mainTab, search]);

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                {mainTab !== 'logs' && (
                    <div className="w-full md:w-auto">
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full md:w-[300px]"
                        />
                    </div>
                )}
            </div>

            <Tabs value={mainTab} onValueChange={setMainTab} className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-5 lg:w-[650px]">
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                    <TabsTrigger value="sellers">Sellers</TabsTrigger>
                    <TabsTrigger value="listings">Listings</TabsTrigger>
                    <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>

                {/* CUSTOMERS CONTENT */}
                <TabsContent value="customers" className="space-y-4">
                    <Tabs defaultValue="pending" className="w-full">
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="pending">Pending Approval ({customers.filter(c => c.status === 'PENDING').length})</TabsTrigger>
                                <TabsTrigger value="all">All Customers ({customers.length})</TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="pending" className="mt-4">
                            <UserGroupList
                                users={customers.filter(c => c.status === 'PENDING')}
                                type="CUSTOMER"
                                isPending={true}
                                onUpdateStatus={handleUserStatusUpdate}
                                onWarn={handleWarnUser}
                                loading={loading}
                            />
                        </TabsContent>
                        <TabsContent value="all" className="mt-4">
                            <UserGroupList
                                users={customers}
                                type="CUSTOMER"
                                isPending={false}
                                onUpdateStatus={handleUserStatusUpdate}
                                onWarn={handleWarnUser}
                                loading={loading}
                            />
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* SELLERS CONTENT */}
                <TabsContent value="sellers" className="space-y-4">
                    <Tabs defaultValue="pending" className="w-full">
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="pending">Pending Approval ({sellers.filter(s => s.status === 'PENDING').length})</TabsTrigger>
                                <TabsTrigger value="all">All Sellers ({sellers.length})</TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="pending" className="mt-4">
                            <UserGroupList
                                users={sellers.filter(c => c.status === 'PENDING')}
                                type="SELLER"
                                isPending={true}
                                onUpdateStatus={handleUserStatusUpdate}
                                onWarn={handleWarnUser}
                                loading={loading}
                            />
                        </TabsContent>
                        <TabsContent value="all" className="mt-4">
                            <UserGroupList
                                users={sellers}
                                type="SELLER"
                                isPending={false}
                                onUpdateStatus={handleUserStatusUpdate}
                                onWarn={handleWarnUser}
                                loading={loading}
                            />
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* LISTINGS CONTENT */}
                <TabsContent value="listings" className="space-y-4">
                    <Tabs defaultValue="pending" className="w-full">
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="pending">Pending Approval ({listings.filter(l => l.status === 'PENDING').length})</TabsTrigger>
                                <TabsTrigger value="all">All Listings ({listings.length})</TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="pending" className="mt-4">
                            <ListingGroupList
                                listings={listings.filter(l => l.status === 'PENDING')}
                                isPending={true}
                                onUpdateStatus={handleListingStatusUpdate}
                                onWarnSeller={handleWarnUser}
                                onViewListing={handleViewListing}
                                loading={loading}
                            />
                        </TabsContent>
                        <TabsContent value="all" className="mt-4">
                            <ListingGroupList
                                listings={listings}
                                isPending={false}
                                onUpdateStatus={handleListingStatusUpdate}
                                onWarnSeller={handleWarnUser}
                                onViewListing={handleViewListing}
                                loading={loading}
                            />
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* BLACKLIST CONTENT */}
                <TabsContent value="blacklist" className="space-y-4">
                    <BlacklistManagement />
                </TabsContent>

                {/* LOGS CONTENT */}
                <TabsContent value="logs" className="space-y-4">
                    <ActivityLogs token={token} />
                </TabsContent>
            </Tabs>

            {/* Warning Modal */}
            {
                warningOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle>Send Warning</CardTitle>
                                <CardDescription>Send a strict warning to this user via the chat system.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <textarea
                                    className="w-full border rounded-md p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-green-500/20"
                                    placeholder="Enter warning message..."
                                    value={warningMessage}
                                    onChange={(e) => setWarningMessage(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setWarningOpen(false)}>Cancel</Button>
                                    <Button onClick={submitWarning} variant="destructive">Send Warning</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* View Listing Modal */}
            {
                viewListingOpen && selectedListingForView && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-zinc-950 z-10 border-b">
                                <div>
                                    <CardTitle className="text-xl">{selectedListingForView.title}</CardTitle>
                                    <CardDescription>Listing Details</CardDescription>
                                </div>
                                <Button variant="ghost" className="h-12 w-12 rounded-full hover:bg-muted shrink-0" onClick={() => setViewListingOpen(false)}>
                                    <span className="sr-only">Close</span>
                                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                {selectedListingForView.imageUrl && (
                                    <div className="w-full h-64 relative rounded-md overflow-hidden bg-gray-100">
                                        <img src={selectedListingForView.imageUrl} alt={selectedListingForView.title} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-sm text-gray-500 font-medium">Price</span>
                                        <p className="font-semibold text-lg">${Number(selectedListingForView.price).toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-sm text-gray-500 font-medium">Status</span>
                                        <div><StatusBadge status={selectedListingForView.status} /></div>
                                    </div>
                                    <div className="space-y-1 col-span-1 md:col-span-2">
                                        <span className="text-sm text-gray-500 font-medium">Description</span>
                                        <p className="text-sm whitespace-pre-wrap">{selectedListingForView.description}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-sm text-gray-500 font-medium">Seller</span>
                                        <p className="text-sm font-medium">{selectedListingForView.seller?.name}</p>
                                        <p className="text-xs font-semibold text-muted-foreground">{selectedListingForView.seller?.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-sm text-gray-500 font-medium">Created At</span>
                                        <p className="text-sm">{new Date(selectedListingForView.createdAt).toLocaleString()}</p>
                                    </div>

                                    {/* Cannabis Metadata & Extras */}
                                    {selectedListingForView.type && (
                                        <div className="space-y-1">
                                            <span className="text-sm text-gray-500 font-medium">Type</span>
                                            <p className="text-sm">{selectedListingForView.type}</p>
                                        </div>
                                    )}
                                    {selectedListingForView.strainType && (
                                        <div className="space-y-1">
                                            <span className="text-sm text-gray-500 font-medium">Strain</span>
                                            <p className="text-sm">{selectedListingForView.strainType}</p>
                                        </div>
                                    )}
                                    {selectedListingForView.flavors && (
                                        <div className="space-y-1">
                                            <span className="text-sm text-gray-500 font-medium">Flavors</span>
                                            <p className="text-sm">{selectedListingForView.flavors}</p>
                                        </div>
                                    )}
                                    {selectedListingForView.effects && (
                                        <div className="space-y-1">
                                            <span className="text-sm text-gray-500 font-medium">Effects</span>
                                            <p className="text-sm">{selectedListingForView.effects}</p>
                                        </div>
                                    )}
                                    {selectedListingForView.thcContent !== undefined && selectedListingForView.thcContent !== null && (
                                        <div className="space-y-1">
                                            <span className="text-sm text-gray-500 font-medium">THC Content</span>
                                            <p className="text-sm">{selectedListingForView.thcContent}%</p>
                                        </div>
                                    )}
                                    {selectedListingForView.cbdContent !== undefined && selectedListingForView.cbdContent !== null && (
                                        <div className="space-y-1">
                                            <span className="text-sm text-gray-500 font-medium">CBD Content</span>
                                            <p className="text-sm">{selectedListingForView.cbdContent}%</p>
                                        </div>
                                    )}
                                    {selectedListingForView.sku && (
                                        <div className="space-y-1">
                                            <span className="text-sm text-gray-500 font-medium">SKU</span>
                                            <p className="text-sm">{selectedListingForView.sku}</p>
                                        </div>
                                    )}
                                    {(selectedListingForView.minQuantity !== undefined) && (
                                        <div className="space-y-1">
                                            <span className="text-sm text-gray-500 font-medium">Min Quantity</span>
                                            <p className="text-sm">{selectedListingForView.minQuantity}</p>
                                        </div>
                                    )}
                                    {selectedListingForView.deliveryAvailable && (
                                        <div className="space-y-1">
                                            <span className="text-sm text-gray-500 font-medium">Delivery</span>
                                            <p className="text-sm text-green-600 font-medium">Available</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </div >
    );
}

// ----------------------------------------------------------------------
// SUB COMPONENTS
// ----------------------------------------------------------------------

function UserGroupList({ users, type, isPending, onUpdateStatus, onWarn, loading }: any) {
    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading data...</div>;

    if (users.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-gray-500">
                    No {type.toLowerCase()}s found in this category.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4">
            {users.map((u: any) => (
                <Card key={u.id} className="overflow-hidden">
                    <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">{u.name}</span>
                                <StatusBadge status={u.status} />
                            </div>
                            <div className="text-sm text-gray-500">{u.email}</div>
                            {u.sellerProfile && (
                                <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 inline-block px-2 py-1 rounded">
                                    📍 {u.sellerProfile.city}, {u.sellerProfile.country}
                                </div>
                            )}
                            <div className="text-xs text-gray-400 pt-1">
                                Signed up: {new Date(u.createdAt).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            {isPending ? (
                                <>
                                    <Button onClick={() => onUpdateStatus(u.id, 'ACTIVE')} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                                        Approve
                                    </Button>
                                    <Button onClick={() => onUpdateStatus(u.id, 'REJECTED')} variant="destructive" className="w-full sm:w-auto">
                                        Reject
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => onWarn(u.id)} className="w-full sm:w-auto">
                                        ⚠️ Warn
                                    </Button>
                                    {u.status === 'ACTIVE' ? (
                                        <Button onClick={() => onUpdateStatus(u.id, 'SUSPENDED')} variant="destructive" size="sm" className="w-full sm:w-auto">
                                            Suspend
                                        </Button>
                                    ) : (
                                        <Button onClick={() => onUpdateStatus(u.id, 'ACTIVE')} variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50 w-full sm:w-auto">
                                            Re-Activate
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function ListingGroupList({ listings, isPending, onUpdateStatus, onWarnSeller, onViewListing, loading }: any) {
    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading data...</div>;

    if (listings.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-gray-500">
                    No listings found in this category.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4">
            {listings.map((l: any) => (
                <Card key={l.id} className="overflow-hidden">
                    <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">{l.title}</span>
                                <StatusBadge status={l.status} />
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                ${l.price}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1 max-w-md">
                                {l.description}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium pt-1">
                                Seller: {l.seller?.name || 'Unknown'} ({l.seller?.email})
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            <Button variant="secondary" size="sm" onClick={() => onViewListing?.(l)} className="w-full sm:w-auto">
                                👁️ View
                            </Button>
                            {isPending ? (
                                <>
                                    <Button onClick={() => onUpdateStatus(l.id, 'ACTIVE')} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                                        Approve
                                    </Button>
                                    <Button onClick={() => onUpdateStatus(l.id, 'REJECTED')} variant="destructive" className="w-full sm:w-auto">
                                        Reject
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => onWarnSeller(l.seller?.id, l.id)} className="w-full sm:w-auto">
                                        ⚠️ Warn Seller
                                    </Button>
                                    {l.status === 'ACTIVE' ? (
                                        <Button onClick={() => onUpdateStatus(l.id, 'REJECTED')} variant="destructive" size="sm" className="w-full sm:w-auto">
                                            Suspend
                                        </Button>
                                    ) : (
                                        <Button onClick={() => onUpdateStatus(l.id, 'ACTIVE')} variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50 w-full sm:w-auto">
                                            Re-Activate
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
        ACTIVE: "bg-green-100 text-green-800 border-green-200",
        REJECTED: "bg-red-100 text-red-800 border-red-200",
        SUSPENDED: "bg-red-100 text-red-800 border-red-200",
        SOLD: "bg-blue-100 text-blue-800 border-blue-200",
    };

    const defaultStyle = "bg-gray-100 text-gray-800 border-gray-200";

    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[status] || defaultStyle}`}>
            {status}
        </span>
    );
}



