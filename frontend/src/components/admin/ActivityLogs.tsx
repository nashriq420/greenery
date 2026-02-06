'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Log = {
    id: string;
    action: string;
    details: string;
    ipAddress: string;
    createdAt: string;
    user?: {
        name: string;
        email: string;
        role: string;
        profilePicture?: string;
    };
}

export default function ActivityLogs({ token }: { token: string | null }) {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [category, setCategory] = useState('ALL');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const queryString = queryParams.toString();
            const endpoint = `/admin/logs${queryString ? `?${queryString}` : ''}`;

            const res = await api.get(endpoint, token || undefined);
            if (Array.isArray(res)) {
                setLogs(res);
            }
        } catch (err) {
            console.error("Failed to fetch logs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchLogs();
        }, 500); // Debounce search
        return () => clearTimeout(timeout);
    }, [search, startDate, endDate, token]); // Category handled client side for display

    const getFilteredLogs = () => {
        if (category === 'ALL') return logs;

        return logs.filter(log => {
            if (category === 'AUTH') return ['LOGIN', 'SIGNUP'].some(a => log.action.includes(a));
            if (category === 'MARKETPLACE') return ['LISTING'].some(a => log.action.includes(a));
            if (category === 'COMMUNITY') return ['POST', 'COMMENT', 'LIKE'].some(a => log.action.includes(a));
            if (category === 'ADMIN') return ['APPROVE', 'REJECT', 'WARN', 'UPDATE_USER', 'BANNER'].some(a => log.action.includes(a));
            return true;
        });
    };

    const displayLogs = getFilteredLogs();

    const renderDetails = (detailsRaw: string) => {
        let details: any;
        try {
            details = typeof detailsRaw === 'string' ? JSON.parse(detailsRaw) : detailsRaw;
        } catch {
            return <span className="text-gray-500">{String(detailsRaw)}</span>;
        }

        if (typeof details !== 'object' || details === null) return <span>{String(details)}</span>;

        // Rich Listing Preview (Snapshot)
        if (details.listingTitle || details.listingImage) {
            return (
                <div className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-100 dark:border-gray-700">
                    {details.listingImage ? (
                        <img
                            src={details.listingImage}
                            alt="Preview"
                            className="w-12 h-12 rounded object-cover border"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500">No Img</div>
                    )}
                    <div className="min-w-0">
                        <div className="font-medium text-sm truncate max-w-[200px]" title={details.listingTitle}>
                            {details.listingTitle || 'Untitled Listing'}
                        </div>
                        <div className="text-xs text-gray-400 font-mono truncate max-w-[150px]">
                            ID: {details.listingId}
                        </div>
                        {details.status && (
                            <div className={`text-xs font-medium mt-0.5 ${details.status === 'ACTIVE' || details.status === 'APPROVED' ? 'text-green-600' :
                                details.status === 'REJECTED' ? 'text-red-600' : 'text-gray-500'
                                }`}>
                                Status: {
                                    details.status === 'ACTIVE' ? 'Approved' :
                                        details.status === 'REJECTED' ? 'Rejected' :
                                            details.status
                                }
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Generic Key-Value rendering for other logs
        return (
            <div className="space-y-1">
                {Object.entries(details).map(([key, value]) => {
                    if (key === 'ip' || key === 'device' || key === 'location') return null; // Skip technical fields if they clutter

                    let displayValue = String(value);
                    let displayKey = key;

                    if (key === 'status') {
                        if (displayValue === 'ACTIVE') displayValue = 'Approved';
                        if (displayValue === 'REJECTED') displayValue = 'Rejected';
                    }

                    return (
                        <div key={key} className="text-xs break-words">
                            <span className="font-semibold text-gray-600 dark:text-gray-400 capitalize">{displayKey.replace(/([A-Z])/g, ' $1').trim()}: </span>
                            <span className="text-gray-800 dark:text-gray-200">{displayValue}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <CardTitle>Activity Logs</CardTitle>
                        <CardDescription>Monitor all system activities.</CardDescription>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-4">
                    <div className="flex-1 w-full">
                        <Input
                            placeholder="Search by user name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full md:max-w-sm"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full sm:w-auto"
                        />
                        <span className="self-center text-gray-500 text-center sm:text-left">to</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full sm:w-auto"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <Tabs defaultValue="ALL" onValueChange={setCategory} className="w-full">
                        <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 p-1 bg-muted/50">
                            <TabsTrigger value="ALL" className="flex-grow sm:flex-grow-0">All Activities</TabsTrigger>
                            <TabsTrigger value="AUTH" className="flex-grow sm:flex-grow-0">Authentication</TabsTrigger>
                            <TabsTrigger value="MARKETPLACE" className="flex-grow sm:flex-grow-0">Marketplace</TabsTrigger>
                            <TabsTrigger value="COMMUNITY" className="flex-grow sm:flex-grow-0">Community</TabsTrigger>
                            <TabsTrigger value="ADMIN" className="flex-grow sm:flex-grow-0">Admin Actions</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading logs...</div>
                ) : displayLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No logs found matching your criteria.</div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block rounded-md border overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap">Date & Time</th>
                                        <th className="px-4 py-3 font-medium">Action</th>
                                        <th className="px-4 py-3 font-medium">User</th>
                                        <th className="px-4 py-3 font-medium w-[300px]">Details</th>
                                        <th className="px-4 py-3 font-medium">IP Address</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {displayLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${log.action.includes('REJECT') || log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                                                    log.action.includes('APPROVE') || log.action.includes('CREATE') ? 'bg-green-100 text-green-800' :
                                                        log.action.includes('WARN') ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.user ? (
                                                    <div className="flex items-center gap-2">
                                                        {log.user.profilePicture ? (
                                                            <img
                                                                src={log.user.profilePicture}
                                                                alt={log.user.name}
                                                                className="w-6 h-6 rounded-full object-cover border"
                                                            />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                                {log.user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium">{log.user.name}</div>
                                                            <div className="text-xs text-gray-500">{log.user.email}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="italic text-gray-400">System</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {renderDetails(log.details)}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                                {log.ipAddress}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {displayLogs.map((log) => (
                                <div key={log.id} className="border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-900 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${log.action.includes('REJECT') || log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                                            log.action.includes('APPROVE') || log.action.includes('CREATE') ? 'bg-green-100 text-green-800' :
                                                log.action.includes('WARN') ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {log.action}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase font-semibold mb-1">User</div>
                                        {log.user ? (
                                            <div className="flex items-center gap-2">
                                                {log.user.profilePicture ? (
                                                    <img
                                                        src={log.user.profilePicture}
                                                        alt={log.user.name}
                                                        className="w-6 h-6 rounded-full object-cover border"
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                        {log.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium">{log.user.name}</div>
                                                    <div className="text-xs text-gray-500">{log.user.email}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="italic text-gray-400 text-sm">System</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Details</div>
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-sm">
                                            {renderDetails(log.details)}
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t flex justify-end">
                                        <span className="text-xs font-mono text-gray-400">IP: {log.ipAddress}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card >
    );
}
