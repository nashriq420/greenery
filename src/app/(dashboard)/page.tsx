'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/Map'), { ssr: false });

export default function DashboardPage() {
    const { user } = useAuthStore();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="font-bold text-lg mb-2">Subscription</h3>
                    <p className="text-gray-500">Status: <span className="text-yellow-600 font-medium">Free Trial</span></p>
                    <div className="mt-4">
                        <Link href="/dashboard/subscription" className="text-sm text-blue-600 hover:underline">Upgrade to Pro</Link>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border md:col-span-2">
                    <h3 className="font-bold text-lg mb-4">Nearby Sellers</h3>
                    <MapComponent />
                </div>
            </div>
        </div>
    );
}
