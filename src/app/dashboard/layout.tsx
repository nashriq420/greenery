'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect } from 'react';
import NotificationMenu from '@/components/NotificationMenu';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        const token = useAuthStore.getState().token;
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="border-b h-16 flex items-center px-6 justify-between bg-white">
                <div className="font-bold text-xl text-green-700 flex items-center gap-2">
                    <span>🌿</span> Greenery
                </div>
                <nav className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-sm font-medium hover:text-green-600">Dashboard</Link>
                    <Link href="/dashboard/chat" className="text-sm font-medium hover:text-green-600">Chat</Link>
                    <Link href="/dashboard/profile" className="text-sm font-medium hover:text-green-600">Profile</Link>
                    {user?.role === 'ADMIN' && (
                        <Link href="/dashboard/admin" className="text-sm font-medium hover:text-green-600">Admin</Link>
                    )}
                </nav>
                <div className="flex items-center gap-4">
                    <NotificationMenu />
                    <span className="text-sm text-gray-600">Hello, {user?.name || 'User'}</span>
                    <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
                </div>
            </header>
            <main className="flex-1 bg-gray-50 p-6">
                {children}
            </main>
        </div>
    );
}
