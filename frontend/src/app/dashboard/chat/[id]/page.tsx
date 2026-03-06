'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Send, Store, ArrowLeft, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PrivacyWarning from '../components/PrivacyWarning';

export default function ChatRoomPage() {
    const params = useParams();
    const router = useRouter();
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

                // Clear unread notifications for this chat if there are any
                const hasUnread = data.some((m: any) => !m.read && m.receiverId === user?.id);
                if (hasUnread) {
                    await api.put(`/chat/${id}/read`, {}, token || '');
                    window.dispatchEvent(new Event('chat-read'));
                }
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

    const handleReactivate = async () => {
        try {
            await api.put(`/chat/${id}/reactivate`, {}, token || '');
            setChatDetails((prev: any) => ({ ...prev, isActive: true }));
        } catch (error) {
            console.error("Failed to reactivate chat", error);
            alert("Failed to reactivate chat");
        }
    };

    if (loading) return <div className="p-8">Loading conversation...</div>;

    return (
        <div className="flex flex-col h-full relative">
            {/* Header */}
            <div className="bg-card border-b border-border p-3 sm:p-4 flex items-center gap-3 shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 -ml-2 md:hidden"
                    onClick={() => router.push('/dashboard/chat')}
                    title="Back to Chats"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="font-bold text-lg flex items-center gap-2 text-foreground">
                        Chat Room
                        {chatDetails?.isActive === false && (
                            <span className="text-xs font-normal text-red-500 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-900/50">Closed</span>
                        )}
                    </h1>
                    {chatDetails && (
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            {user?.id === chatDetails.participant1.id ? chatDetails.participant2.name : chatDetails.participant1.name}
                            {(user?.id === chatDetails.participant1.id ? chatDetails.participant2.subscription?.status : chatDetails.participant1.subscription?.status) === 'ACTIVE' && (
                                <>
                                    <span title="Verified Premium Seller" className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 text-white rounded-full text-[10px] shadow-sm ml-0.5 shrink-0">
                                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                                    </span>
                                    <span className="bg-linear-to-r from-yellow-400 to-yellow-600 text-white px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm shrink-0">
                                        <Star size={8} fill="currentColor" /> Premium
                                    </span>
                                </>
                            )}
                        </p>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-muted/50 flex flex-col">
                <div className="p-4 space-y-4 pb-0">
                    <PrivacyWarning />

                    {messages.length === 0 && (
                        <p className="text-center text-muted-foreground my-10">No messages yet. Say hello!</p>
                    )}

                    {messages.map((msg) => {
                        const isMe = msg.sender.id === user?.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                                {!isMe && (
                                    <div className="shrink-0 mr-2 self-end mb-1">
                                        {msg.sender.profilePicture ? (
                                            <img src={msg.sender.profilePicture} alt={msg.sender.name} className="w-6 h-6 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-[10px]">
                                                {msg.sender.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'}`}>
                                    {msg.listing && (
                                        <div className={`mb-2 rounded-lg overflow-hidden border ${isMe ? 'border-primary/50 bg-primary-foreground/10' : 'border-border bg-muted'} p-2 flex gap-3 items-center group cursor-pointer hover:opacity-90 transition`}>
                                            {msg.listing.imageUrl ? (
                                                <div className="w-12 h-12 rounded bg-muted shrink-0 overflow-hidden relative">
                                                    <img src={msg.listing.imageUrl} className="absolute inset-0 w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate">{msg.listing.title}</p>
                                                <p className="text-xs opacity-80">${msg.listing.price}</p>
                                            </div>
                                        </div>
                                    )}
                                    <p>{msg.content}</p>
                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            {chatDetails?.isActive === false ? (
                <div className="bg-muted/50 border-t border-border p-4 flex flex-col items-center justify-center shrink-0 min-h-[80px]">
                    <p className="text-sm text-muted-foreground mb-3">This chat was closed due to inactivity.</p>
                    <Button onClick={handleReactivate} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-6 rounded-lg">
                        Reactivate Chat
                    </Button>
                </div>
            ) : (
                <div className="bg-card border-t border-border p-2 sm:p-4 flex gap-2 relative items-center shrink-0">
                    {/* Listing Picker Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowListingPicker(!showListingPicker)}
                            className="h-12 w-12 sm:w-auto sm:px-4 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg border border-border flex items-center justify-center"
                            title="Attach Listing"
                        >
                            <Store className="w-5 h-5 sm:mr-2" />
                            <span className="hidden sm:inline">Store</span>
                        </button>

                        {/* Listing Picker Popover */}
                        {showListingPicker && (
                            <div className="absolute bottom-full left-0 mb-2 w-72 bg-card border border-border rounded-lg shadow-xl max-h-96 overflow-y-auto z-10 p-2">
                                <h3 className="font-bold text-sm mb-2 px-2 text-foreground">Select a Listing to Share</h3>
                                {availableListings.length === 0 ? (
                                    <p className="text-sm text-muted-foreground px-2 py-4">No listings available.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {availableListings.map(l => (
                                            <div
                                                key={l.id}
                                                onClick={() => handleSend(l.id)}
                                                className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer border border-border"
                                            >
                                                {l.imageUrl && <img src={l.imageUrl} className="w-10 h-10 object-cover rounded bg-muted" />}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold truncate text-foreground">{l.title}</p>
                                                    <p className="text-xs text-muted-foreground">${l.price}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <input
                        className="flex-1 border border-border bg-card text-foreground rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary h-12"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={() => handleSend()}
                        className="bg-primary text-primary-foreground w-12 sm:w-auto sm:px-6 h-12 rounded-lg font-bold hover:bg-primary/90 transition flex items-center justify-center"
                        title="Send Message"
                    >
                        <Send className="w-5 h-5 sm:hidden" />
                        <span className="hidden sm:inline">Send</span>
                    </button>
                </div>
            )}
        </div>
    );
}
