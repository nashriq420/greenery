'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function ChatRoomPage() {
    const params = useParams();
    const id = params?.id as string;
    const { token, user } = useAuthStore();

    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Listing Picker State
    const [showListingPicker, setShowListingPicker] = useState(false);
    const [availableListings, setAvailableListings] = useState<any[]>([]);
    const [chatDetails, setChatDetails] = useState<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        try {
            const data = await api.get(`/chat/${id}/messages`, token || '');
            if (Array.isArray(data)) {
                setMessages(data);
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch chat details to know who is who, then fetch listings
    useEffect(() => {
        if (!token || !id) return;

        // We need to know who the seller is to fetch listings
        const initChat = async () => {
            try {
                // Get all chats to find this one and its participants
                // Optimized: create a specific endpoint for getChatDetails would be better, 
                // but re-using /chat for now and filtering is easier given current API
                const chats = await api.get('/chat', token);
                const currentChat = chats.find((c: any) => c.id === id);

                if (currentChat) {
                    setChatDetails(currentChat);

                    // Determine Seller ID
                    let sellerId = null;
                    if (currentChat.participant1.role === 'SELLER') sellerId = currentChat.participant1.id;
                    else if (currentChat.participant2.role === 'SELLER') sellerId = currentChat.participant2.id;
                    // If both are sellers (unlikely given flow but possible), maybe just show current user's or other's?
                    // Let's assume standard flow: If I am Seller, show MINE. If I am Customer, show THEIRS.

                    const targetSellerId = user?.role === 'SELLER' ? user.id :
                        (currentChat.participant1.id === user?.id ? currentChat.participant2.id : currentChat.participant1.id);

                    // Fetch listings for this seller 
                    // We need a route to fetch listings by sellerId or 'my-listings'
                    // Existing routes: /marketplace/listings?sellerId=... OR /marketplace/my-listings

                    if (user?.role === 'SELLER') {
                        const listings = await api.get('/marketplace/my-listings', token);
                        setAvailableListings(listings || []);
                    } else {
                        // Creating a generic search/list endpoint usage if available, 
                        // or unfortunately we might rely on the map search? 
                        // Actually, let's just use the /marketplace/listings endpoint if possible. 
                        // Check marketplace.controller.ts -> getListings takes query params? 
                        // It seems getListings returns ALL. 
                        // Let's rely on the fact that we can view listings if we know the seller.
                        // Wait, fetching 'All Listings' and filtering client side isn't great but works for small scale.
                        // Better: reuse the public "View Seller Profile" logic if exists.
                        // Let's try fetching all active listings for now (assuming marketplace page logic).
                        const allListings = await api.get('/marketplace/listings', token);
                        if (Array.isArray(allListings)) {
                            setAvailableListings(allListings.filter((l: any) => l.seller.id === targetSellerId));
                        }
                    }
                }
            } catch (err) {
                console.error("Error init chat context", err);
            }
        };

        fetchMessages();
        initChat();

        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [id, token, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (listingId?: string) => {
        if (!newMessage.trim() && !listingId) return;

        try {
            await api.post(`/chat/${id}/messages`, { content: newMessage || 'Shared a listing', listingId }, token || '');
            setNewMessage('');
            setShowListingPicker(false);
            fetchMessages();
        } catch (error) {
            console.error("Failed to send message", error);
            alert("Failed to send message");
        }
    };

    if (loading) return <div className="p-8">Loading conversation...</div>;

    return (
        <div className="h-[calc(100vh-100px)] p-6 flex flex-col relative">
            <div className="bg-white border rounded-t-lg p-4 shadow-sm flex justify-between items-center">
                <h1 className="font-bold text-lg">Chat Room</h1>
                {/* Optional: Show who you are chatting with */}
            </div>

            <div className="flex-1 bg-gray-50 border-x p-4 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                    <p className="text-center text-gray-400 my-10">No messages yet. Say hello!</p>
                )}

                {messages.map((msg) => {
                    const isMe = msg.sender.id === user?.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'}`}>
                                {msg.listing && (
                                    <div className={`mb-2 rounded-lg overflow-hidden border ${isMe ? 'border-blue-400 bg-blue-700/50' : 'border-gray-200 bg-gray-50'} p-2 flex gap-3 items-center group cursor-pointer hover:opacity-90 transition`}>
                                        {msg.listing.imageUrl ? (
                                            <div className="w-12 h-12 rounded bg-gray-200 shrink-0 overflow-hidden relative">
                                                <img src={msg.listing.imageUrl} className="absolute inset-0 w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded bg-gray-700/20 shrink-0 flex items-center justify-center text-xs">No Img</div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">{msg.listing.title}</p>
                                            <p className="text-xs opacity-80">${msg.listing.price}</p>
                                        </div>
                                    </div>
                                )}
                                <p>{msg.content}</p>
                                <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border rounded-b-lg p-4 flex gap-2 relative">
                {/* Listing Picker Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowListingPicker(!showListingPicker)}
                        className="p-3 text-gray-500 hover:bg-gray-100 rounded-lg border"
                        title="Attach Listing"
                    >
                        Store
                    </button>

                    {/* Listing Picker Popover */}
                    {showListingPicker && (
                        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border rounded-lg shadow-xl max-h-96 overflow-y-auto z-10 p-2">
                            <h3 className="font-bold text-sm mb-2 px-2">Select a Listing to Share</h3>
                            {availableListings.length === 0 ? (
                                <p className="text-sm text-gray-500 px-2 py-4">No listings available.</p>
                            ) : (
                                <div className="space-y-2">
                                    {availableListings.map(l => (
                                        <div
                                            key={l.id}
                                            onClick={() => handleSend(l.id)}
                                            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer border"
                                        >
                                            {l.imageUrl && <img src={l.imageUrl} className="w-10 h-10 object-cover rounded bg-gray-200" />}
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate">{l.title}</p>
                                                <p className="text-xs text-gray-500">${l.price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <input
                    className="flex-1 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                    onClick={() => handleSend()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
