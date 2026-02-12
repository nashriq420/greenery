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
                <div className="absolute top-16 left-0 w-full bg-white border-b shadow-lg flex flex-col p-4 gap-4 z-[9999]">
                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-sm font-medium hover:text-green-600 p-2 border-b">Dashboard</Link>
                    <Link href="/dashboard/marketplace" onClick={() => setIsOpen(false)} className="text-sm font-medium hover:text-green-600 p-2 border-b">Marketplace</Link>
                    <Link href="/dashboard/community" onClick={() => setIsOpen(false)} className="text-sm font-medium hover:text-green-600 p-2 border-b">Community</Link>
                    <Link href="/dashboard/chat" onClick={() => setIsOpen(false)} className="text-sm font-medium hover:text-green-600 p-2 border-b">Chat</Link>
                    <Link href="/dashboard/blacklist" onClick={() => setIsOpen(false)} className="text-sm font-medium hover:text-red-600 p-2 border-b">Safety</Link>
                    <Link href="/dashboard/profile" onClick={() => setIsOpen(false)} className="text-sm font-medium hover:text-green-600 p-2 border-b">Profile</Link>
                    {user?.role === 'ADMIN' && (
                        <Link href="/dashboard/admin" onClick={() => setIsOpen(false)} className="text-sm font-medium hover:text-green-600 p-2 border-b">Admin</Link>
                    )}
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">Hello, {user?.name || 'User'}</span>
                        <Button variant="outline" size="sm" onClick={() => { setIsOpen(false); onLogout(); }}>Logout</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
