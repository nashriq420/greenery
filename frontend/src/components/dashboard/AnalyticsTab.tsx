'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart3, Package, CheckCircle2, MessageCircle, Star } from 'lucide-react';

export default function AnalyticsTab() {
    const { token, user } = useAuthStore();
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!token) return;
            try {
                const res = await api.get('/analytics/seller', token);
                setMetrics(res.metrics);
            } catch (error) {
                console.error("Failed to load analytics", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.subscription?.status === 'ACTIVE') {
            fetchAnalytics();
        } else {
            setLoading(false);
        }
    }, [token, user]);

    if (!user || user.subscription?.status !== 'ACTIVE') {
        return (
            <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-800">
                        <BarChart3 className="w-5 h-5" />
                        Premium Feature Placeholder
                    </CardTitle>
                    <CardDescription className="text-yellow-700">
                        Subscribe to Premium to view advanced shop analytics.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500 animate-pulse">Loading analytics...</div>;
    }

    if (!metrics) {
        return <div className="p-8 text-center text-gray-500">Analytics data is currently unavailable.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Performance Analytics</h2>
                <p className="text-muted-foreground">Detailed overview of your marketplace performance.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalListings}</div>
                        <p className="text-xs text-muted-foreground">All time created</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.activeListings}</div>
                        <p className="text-xs text-muted-foreground">Currently visible in marketplace</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Message Threads</CardTitle>
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalChats}</div>
                        <p className="text-xs text-muted-foreground">With potential buyers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Number(metrics.averageRating || 0).toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">Based on {metrics.totalReviews} reviews</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Broadcast Activity</CardTitle>
                    <CardDescription>Track the engagement of your broadcast messages.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-[150px] items-center justify-center text-sm text-muted-foreground bg-muted/50 rounded-md border border-dashed">
                        Interactive charts coming soon in the next update.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
