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
                    <div className="flex-1">
                        <Input
                            placeholder="Search by user name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-auto"
                        />
                        <span className="self-center text-gray-500">to</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-auto"
                        />
                    </div>
                </div>

                <Tabs defaultValue="ALL" onValueChange={setCategory} className="mt-4">
                    <TabsList>
                        <TabsTrigger value="ALL">All Activities</TabsTrigger>
                        <TabsTrigger value="AUTH">Authentication</TabsTrigger>
                        <TabsTrigger value="MARKETPLACE">Marketplace</TabsTrigger>
                        <TabsTrigger value="COMMUNITY">Community</TabsTrigger>
                        <TabsTrigger value="ADMIN">Admin Actions</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading logs...</div>
                ) : displayLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No logs found matching your criteria.</div>
                ) : (
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                <tr>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Date & Time</th>
                                    <th className="px-4 py-3 font-medium">Action</th>
                                    <th className="px-4 py-3 font-medium">User</th>
                                    <th className="px-4 py-3 font-medium">Details</th>
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
                                                <div>
                                                    <div className="font-medium">{log.user.name}</div>
                                                    <div className="text-xs text-gray-500">{log.user.email}</div>
                                                </div>
                                            ) : (
                                                <span className="italic text-gray-400">System</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 max-w-[300px] break-words text-gray-600">
                                            {log.details}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                            {log.ipAddress}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
