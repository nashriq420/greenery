'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, Megaphone } from 'lucide-react';
import BroadcastModal from './BroadcastModal';

export default function ChatSidebar({ className = "" }: { className?: string }) {
    const { token, user } = useAuthStore();
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const params = useParams();
    const activeId = params?.id;

    const fetchChats = async () => {
        if (!token) return;
        try {
            const data = await api.get('/chat', token);
            if (Array.isArray(data)) {
                // Sort by last updated
                const sorted = data.sort((a, b) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
                setChats(sorted);
            }
        } catch (error) {
            console.error("Failed to fetch chats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChats();
        // Poll for updates to the list order/last message
        const interval = setInterval(fetchChats, 5000);
        return () => clearInterval(interval);
    }, [token]);

    return (
        <div className={`flex flex-col h-full bg-white border-r ${className}`}>
            <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-bold text-xl">Messages</h2>
                {user?.role === 'SELLER' && user?.subscription?.status === 'ACTIVE' && (
                    <button
                        onClick={() => setIsBroadcastOpen(true)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition flex items-center gap-2 text-sm font-medium"
                        title="Broadcast Message"
                    >
                        <Megaphone className="w-5 h-5" />
                    </button>
                )}
            </div>

            <BroadcastModal isOpen={isBroadcastOpen} onClose={() => setIsBroadcastOpen(false)} />

            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search messages"
                        className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-gray-500">Loading chats...</div>
                ) : chats.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No active chats.<br />
                        Start a conversation from the Marketplace!
                    </div>
                ) : (
                    <div className="divide-y">
                        {chats.map(chat => {
                            const otherParticipant = chat.participant1.id === user?.id ? chat.participant2 : chat.participant1;
                            const lastMessage = chat.messages[0]; // Assuming backend returns sorted messages or we check logic
                            // Actually, messages might not be populated in chat list view depending on API. 
                            // The original `page.tsx` used `chat.messages[0]?.content`.

                            const lastMsgContent = lastMessage?.listing
                                ? 'Shared a listing'
                                : (lastMessage?.content || 'No messages yet');

                            const timeString = chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
                            const isActive = activeId === chat.id;

                            return (
                                <Link
                                    href={`/dashboard/chat/${chat.id}`}
                                    key={chat.id}
                                    className={`block p-4 hover:bg-gray-50 transition ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {otherParticipant.profilePicture ? (
                                                <img src={otherParticipant.profilePicture} alt={otherParticipant.name} className={`w-8 h-8 rounded-full object-cover shrink-0 ${chat.isActive === false ? 'grayscale opacity-50' : ''}`} />
                                            ) : (
                                                <div className={`w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 ${chat.isActive === false ? 'grayscale opacity-50' : ''}`}>
                                                    {otherParticipant.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <h3 className={`font-bold text-sm truncate ${isActive ? 'text-blue-700' : 'text-gray-900'} ${chat.isActive === false ? 'opacity-50' : ''}`}>
                                                {otherParticipant.name}
                                                {chat.isActive === false && <span className="ml-2 text-xs font-normal text-red-500 bg-red-50 px-1 py-0.5 rounded">Closed</span>}
                                            </h3>
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2 shrink-0">
                                            {/* Simple formatting for now */}
                                            {timeString}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm truncate pr-2 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                                            {lastMsgContent}
                                        </p>
                                        {/* Unread count badge could go here */}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
