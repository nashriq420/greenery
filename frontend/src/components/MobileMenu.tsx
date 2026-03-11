'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MobileMenu({ user, onLogout }: { user: any, onLogout: () => void }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
                {isOpen ? <X /> : <Menu />}
            </button>

            {isOpen && (
                <div className="absolute top-[60px] md:top-16 left-0 w-full bg-white dark:bg-[#1A1A1A] border-b dark:border-gray-800 shadow-lg flex flex-col p-4 gap-4 z-[9999]">
                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 p-2 border-b dark:border-gray-800">Dashboard</Link>
                    <Link href="/dashboard/marketplace" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 p-2 border-b dark:border-gray-800">Marketplace</Link>
                    <Link href="/dashboard/community" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 p-2 border-b dark:border-gray-800">Community</Link>
                    <Link href="/dashboard/chat" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 p-2 border-b dark:border-gray-800">Chat</Link>
                    <Link href="/dashboard/blacklist" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 p-2 border-b dark:border-gray-800">Safety</Link>
                    <Link href="/dashboard/profile" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 p-2 border-b dark:border-gray-800">Profile</Link>
                    {user?.role === 'ADMIN' && (
                        <Link href="/dashboard/admin" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 p-2 border-b dark:border-gray-800">Admin</Link>
                    )}
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Hello, {user?.name || 'User'}</span>
                        <Button variant="outline" size="sm" onClick={() => { setIsOpen(false); onLogout(); }} className="dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700">Logout</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
