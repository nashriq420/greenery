'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

export default function ChatPage() {
    const { token, user } = useAuthStore();
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        const fetchChats = async () => {
            try {
                const data = await api.get('/chat', token);
                if (Array.isArray(data)) {
                    setChats(data);
                }
            } catch (error) {
                console.error("Failed to fetch chats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchChats();
    }, [token]);

    if (loading) return <div className="p-8">Loading chats...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Messages</h1>
            {chats.length === 0 ? (
                <p className="text-gray-500">No active chats. Start a conversation from the Marketplace!</p>
            ) : (
                <div className="space-y-4">
                    {chats.map(chat => {
                        const otherParticipant = chat.participant1.id === user?.id ? chat.participant2 : chat.participant1;
                        const lastMessage = chat.messages[0]?.content || 'No messages yet';

                        return (
                            <Link href={`/dashboard/chat/${chat.id}`} key={chat.id} className="block bg-white p-4 rounded-lg border hover:shadow-md transition">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{otherParticipant.name}</h3>
                                        <p className="text-gray-500 text-sm truncate">{lastMessage}</p>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : ''}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
