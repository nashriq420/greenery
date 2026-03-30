"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Send,
  Store,
  ArrowLeft,
  Star,
  Check,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Leaf,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PrivacyWarning from "../components/PrivacyWarning";
import { toast } from "react-hot-toast";
import { playNotificationSound } from "@/lib/sound";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { token, user } = useAuthStore();

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef<number>(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Listing Picker State
  const [showListingPicker, setShowListingPicker] = useState(false);
  const [availableListings, setAvailableListings] = useState<any[]>([]);
  const [chatDetails, setChatDetails] = useState<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const data = await api.get(`/chat/${id}/messages`, token || "");
      if (Array.isArray(data)) {
        setMessages(data);

        if (
          previousMessageCountRef.current > 0 &&
          data.length > previousMessageCountRef.current
        ) {
          const newMessages = data.slice(previousMessageCountRef.current);
          const hasIncoming = newMessages.some((m) => m.sender.id !== user?.id);
          if (hasIncoming) {
            playNotificationSound();
            const senderName =
              newMessages.find((m) => m.sender.id !== user?.id)?.sender.name ||
              "User";
            toast.success(`New message from ${senderName}`, { icon: "💬" });
          }
        }
        previousMessageCountRef.current = data.length;

        const hasUnread = data.some(
          (m: any) => !m.read && m.receiverId === user?.id
        );
        if (hasUnread) {
          await api.put(`/chat/${id}/read`, {}, token || "");
          window.dispatchEvent(new Event("chat-read"));
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !id) return;

    const initChat = async () => {
      try {
        const chats = await api.get("/chat", token);
        const currentChat = chats.find((c: any) => c.id === id);

        if (currentChat) {
          setChatDetails(currentChat);

          const targetSellerId =
            user?.role === "SELLER"
              ? user.id
              : currentChat.participant1.id === user?.id
                ? currentChat.participant2.id
                : currentChat.participant1.id;

          if (user?.role === "SELLER") {
            const listings = await api.get("/marketplace/my-listings", token);
            setAvailableListings(listings || []);
          } else {
            const allListings = await api.get("/marketplace/listings", token);
            if (Array.isArray(allListings)) {
              setAvailableListings(
                allListings.filter((l: any) => l.seller.id === targetSellerId)
              );
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
      await api.post(
        `/chat/${id}/messages`,
        { content: newMessage || "Shared a listing", listingId },
        token || ""
      );
      setNewMessage("");
      setShowListingPicker(false);
      fetchMessages();
    } catch (error) {
      console.error("Failed to send message", error);
      alert("Failed to send message");
    }
  };

  const handleReactivate = async () => {
    try {
      await api.put(`/chat/${id}/reactivate`, {}, token || "");
      setChatDetails((prev: any) => ({ ...prev, isActive: true }));
      toast.success("Conversation reactivated!");
    } catch (error) {
      console.error("Failed to reactivate chat", error);
      alert("Failed to reactivate chat");
    }
  };

  // Derived values
  const otherParticipant = chatDetails
    ? user?.id === chatDetails.participant1.id
      ? chatDetails.participant2
      : chatDetails.participant1
    : null;

  const otherSubStatus = chatDetails
    ? (user?.id === chatDetails.participant1.id
        ? chatDetails.participant2.subscription?.status
        : chatDetails.participant1.subscription?.status) === "ACTIVE"
    : false;

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        {/* Header skeleton */}
        <div className="bg-card border-b border-border p-4 flex items-center gap-3 shrink-0">
          <div className="skeleton w-9 h-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-text w-32" />
            <div className="skeleton-text w-20" />
          </div>
        </div>
        {/* Messages skeleton */}
        <div className="flex-1 p-4 space-y-4 bg-muted/30">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
            >
              <div className={`skeleton h-12 rounded-2xl ${i % 2 === 0 ? "w-52 rounded-br-sm" : "w-64 rounded-bl-sm"}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">

      {/* ── Chat Header ──────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 -ml-1 md:hidden rounded-xl"
          onClick={() => router.push("/dashboard/chat")}
          title="Back to Chats"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Avatar */}
        {otherParticipant && (
          <div className="relative shrink-0">
            {otherParticipant.profilePicture ? (
              <img
                src={otherParticipant.profilePicture}
                alt={otherParticipant.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-background"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm ring-2 ring-background">
                {otherParticipant.name?.charAt(0).toUpperCase()}
              </div>
            )}
            {chatDetails?.isActive !== false && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
            )}
          </div>
        )}

        {/* Name & Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-base text-foreground truncate">
              {otherParticipant?.name || "Chat Room"}
            </h1>
            {otherSubStatus && (
              <>
                <span
                  title="Verified Premium Seller"
                  className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 text-white rounded-full text-[10px] shadow-sm shrink-0"
                >
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                </span>
                <span className="bg-linear-to-r from-yellow-400 to-yellow-600 text-white px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm shrink-0">
                  <Star size={8} fill="currentColor" /> Premium
                </span>
              </>
            )}
            {chatDetails?.isActive === false && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 px-2 py-0.5 rounded-full shrink-0">
                Closed
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {chatDetails?.isActive === false
              ? "This conversation is closed"
              : "Active conversation"}
          </p>
        </div>
      </div>

      {/* ── Messages Area ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-muted/30 custom-scrollbar flex flex-col">
        <div className="p-4 space-y-1 pb-2">
          {/* Safety Panel */}
          <PrivacyWarning />

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-3 shadow-soft">
                <Leaf className="w-7 h-7 text-primary/60" />
              </div>
              <p className="font-semibold text-foreground mb-1">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                Say hello! Start the conversation. 👋
              </p>
            </div>
          )}

          {/* Message Bubbles */}
          {messages.map((msg, idx) => {
            const isMe = msg.sender.id === user?.id;
            const prevMsg = messages[idx - 1];
            const isSameGroup =
              prevMsg && prevMsg.sender.id === msg.sender.id;

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"} ${
                  isSameGroup ? "mt-0.5" : "mt-3"
                }`}
              >
                {/* Other user avatar (show on first of group) */}
                {!isMe && (
                  <div className="shrink-0 mr-2 self-end mb-1 w-6">
                    {!isSameGroup &&
                      (msg.sender.profilePicture ? (
                        <img
                          src={msg.sender.profilePicture}
                          alt={msg.sender.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-[10px]">
                          {msg.sender.name?.charAt(0).toUpperCase()}
                        </div>
                      ))}
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-soft ${
                    isMe
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-card border border-border text-foreground rounded-bl-sm"
                  }`}
                >
                  {/* Listing Card */}
                  {msg.listing && (
                    <div
                      className={`mb-3 rounded-xl overflow-hidden border ${
                        isMe
                          ? "border-white/20 bg-white/10"
                          : "border-border bg-muted/50"
                      }`}
                    >
                      <div className="flex gap-3 items-center p-2.5">
                        {msg.listing.imageUrl ? (
                          <div className="w-14 h-14 rounded-lg bg-muted shrink-0 overflow-hidden">
                            <img
                              src={msg.listing.imageUrl}
                              className="w-full h-full object-cover"
                              alt={msg.listing.title}
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm truncate">
                            {msg.listing.title}
                          </p>
                          <p
                            className={`text-xs font-semibold ${
                              isMe ? "text-white/80" : "text-primary"
                            }`}
                          >
                            RM {msg.listing.price}
                          </p>
                        </div>
                      </div>
                      {/* View Listing CTA */}
                      <div className={`border-t ${isMe ? "border-white/20" : "border-border"} px-2.5 py-2`}>
                        <a
                          href={`/dashboard/marketplace`}
                          className={`flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg py-1.5 transition-all ${
                            isMe
                              ? "bg-white/20 hover:bg-white/30 text-white"
                              : "bg-primary/10 hover:bg-primary/20 text-primary"
                          }`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Listing
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Message text */}
                  <p className="text-inherit font-medium text-[15px] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <p
                    className={`text-[10px] mt-1.5 font-medium ${
                      isMe ? "text-white/70" : "text-muted-foreground"
                    } text-right`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* ── Input Area / Closed Banner ───────────────────────────────── */}
      <div className="shrink-0">
        {chatDetails?.isActive === false ? (
          /* ── Closed Chat Banner ──────────────────────────────────── */
          <div className="chat-closed-banner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">
                  This conversation is closed
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Closed due to inactivity. Reopen to continue chatting.
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button
                onClick={handleReactivate}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-xl shadow-soft hover:-translate-y-0.5 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reopen Conversation
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/marketplace")}
                className="flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl"
              >
                <ShoppingBag className="w-4 h-4" />
                Browse Marketplace
              </Button>
            </div>
          </div>
        ) : (
          /* ── Active Input Area ───────────────────────────────────── */
          <div className="bg-card border-t border-border px-3 py-3 flex items-end gap-2 relative">
            {/* Listing Picker Button */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowListingPicker(!showListingPicker)}
                className={`h-10 w-10 rounded-xl border transition-all flex items-center justify-center ${
                  showListingPicker
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title="Attach Listing"
              >
                <Store className="w-4 h-4" />
              </button>

              {/* Listing Picker Popover */}
              {showListingPicker && (
                <div className="absolute bottom-full left-0 mb-2 w-76 bg-card border border-border rounded-2xl shadow-xl max-h-80 overflow-hidden z-20 flex flex-col min-w-[300px]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="font-bold text-sm text-foreground">
                      Share a Listing
                    </h3>
                    <button
                      onClick={() => setShowListingPicker(false)}
                      className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="overflow-y-auto custom-scrollbar flex-1">
                    {availableListings.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground font-medium">
                          No listings available
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {availableListings.map((l) => (
                          <div
                            key={l.id}
                            onClick={() => handleSend(l.id)}
                            className="flex items-center gap-3 p-2.5 hover:bg-muted/70 rounded-xl cursor-pointer border border-transparent hover:border-border transition-all"
                          >
                            {l.imageUrl ? (
                              <img
                                src={l.imageUrl}
                                className="w-10 h-10 object-cover rounded-lg bg-muted shrink-0"
                                alt={l.title}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                                <Leaf className="w-4 h-4 text-muted-foreground/40" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate text-foreground">
                                {l.title}
                              </p>
                              <p className="text-xs text-primary font-bold">
                                RM {l.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Text Input */}
            <textarea
              ref={inputRef}
              rows={1}
              className="flex-1 border border-border bg-muted/50 text-foreground rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 focus:bg-card resize-none overflow-hidden transition-all placeholder:text-muted-foreground/60"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                // Auto-grow
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{ minHeight: "42px" }}
            />

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!newMessage.trim()}
              className="shrink-0 h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
