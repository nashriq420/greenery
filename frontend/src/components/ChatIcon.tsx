'use client';

import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ChatIcon() {
    const { token } = useAuthStore();
    const [unreadCount, setUnreadCount] = useState(0);
    const pathname = usePathname();

    const fetchUnreadCount = async () => {
        if (!token) return;
        try {
            const data = await api.get('/chat/unread/count', token);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch unread chat count', error);
        }
    };

    // Poll for unread count
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, [token]);

    // Listen for cross-component read events
    useEffect(() => {
        const handleChatRead = () => fetchUnreadCount();
        window.addEventListener('chat-read', handleChatRead);
        return () => window.removeEventListener('chat-read', handleChatRead);
    }, [token]);

    // Fast refresh when navigating away from chat
    useEffect(() => {
        if (!pathname?.includes('/dashboard/chat')) {
            fetchUnreadCount();
        }
    }, [pathname]);

    return (
        <Link
            href="/dashboard/chat"
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Messages"
        >
            <MessageSquare className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </Link>
    );
}
