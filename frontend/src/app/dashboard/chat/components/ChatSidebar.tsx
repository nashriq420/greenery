"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Search, Megaphone, MessageSquare } from "lucide-react";
import BroadcastModal from "./BroadcastModal";
import { toast } from "react-hot-toast";
import { playNotificationSound } from "@/lib/sound";

/** Format relative time: "2h ago", "just now", "Mar 12", etc. */
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function ChatSidebar({
  className = "",
}: {
  className?: string;
}) {
  const { user, isAuthenticated } = useAuthStore();
  const [chats, setChats] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const params = useParams();
  const pathname = usePathname();
  const activeId = params?.id;
  const previousLatestUpdateRef = useRef<number>(0);

  const fetchChats = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.get("/chat");
      if (Array.isArray(data)) {
        const sorted = data.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        if (sorted.length > 0) {
          const latestTime = new Date(sorted[0].updatedAt).getTime();
          if (
            previousLatestUpdateRef.current > 0 &&
            latestTime > previousLatestUpdateRef.current
          ) {
            const latestChat = sorted[0];
            const lastMsg = latestChat.messages?.[0];
            if (
              lastMsg &&
              lastMsg.senderId !== user?.id &&
              pathname !== `/dashboard/chat/${latestChat.id}`
            ) {
              playNotificationSound();
              const otherParticipant = 
                latestChat.participant1.id === user?.id ? latestChat.participant2 : latestChat.participant1;
              const senderName = otherParticipant?.name || "Someone";
              toast.success(`New message from ${senderName}`, { icon: "💬" });
            }
          }
          previousLatestUpdateRef.current = latestTime;
        }

        setChats(sorted);
        setFiltered(sorted);
      }
    } catch (error) {
      console.error("Failed to fetch chats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Client-side search filter
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(chats);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        chats.filter((c) => {
          const other =
            c.participant1.id === user?.id ? c.participant2 : c.participant1;
          return (
            other.name?.toLowerCase().includes(q) ||
            c.messages?.[0]?.content?.toLowerCase().includes(q)
          );
        })
      );
    }
  }, [search, chats]);

  return (
    <div
      className={`flex flex-col h-full bg-card ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-bold text-lg text-foreground">Messages</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {chats.length > 0 ? `${chats.length} conversation${chats.length !== 1 ? "s" : ""}` : "No conversations yet"}
          </p>
        </div>
        {user?.role === "SELLER" &&
          user?.subscription?.status === "ACTIVE" && (
            <button
              onClick={() => setIsBroadcastOpen(true)}
              className="p-2.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all flex items-center gap-1.5 text-sm font-semibold"
              title="Broadcast Message"
            >
              <Megaphone className="w-4 h-4" />
              <span className="hidden lg:inline text-xs">Broadcast</span>
            </button>
          )}
      </div>

      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
      />

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted/50 text-foreground rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/60 transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          /* Skeleton loading */
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 items-center p-3 rounded-xl">
                <div className="skeleton w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton-text w-2/3" />
                  <div className="skeleton-text w-4/5" />
                </div>
                <div className="skeleton-text w-8 shrink-0" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-sm text-foreground mb-1">
              {search ? "No results found" : "No conversations yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              {search
                ? "Try a different search term."
                : "Start a conversation from the Marketplace!"}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {filtered.map((chat) => {
              const otherParticipant =
                chat.participant1.id === user?.id
                  ? chat.participant2
                  : chat.participant1;

              const lastMessage = chat.messages?.[0];
              const lastMsgContent = lastMessage?.listing
                ? "📦 Shared a listing"
                : lastMessage?.content || "No messages yet";

              const timeString = chat.updatedAt
                ? relativeTime(chat.updatedAt)
                : "";

              const isActive = activeId === chat.id;
              const isClosed = chat.isActive === false;

              // Unread heuristic: last message exists and was not sent by me
              const hasUnread =
                lastMessage &&
                lastMessage.senderId !== user?.id &&
                !lastMessage.read;

              return (
                <Link
                  href={`/dashboard/chat/${chat.id}`}
                  key={chat.id}
                  className={`flex items-center gap-3 px-3 py-3 mx-2 my-0.5 rounded-xl transition-all duration-150 ${
                    isActive
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/60 border border-transparent"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {otherParticipant.profilePicture ? (
                      <img
                        src={otherParticipant.profilePicture}
                        alt={otherParticipant.name}
                        className={`w-10 h-10 rounded-full object-cover avatar-ring ${
                          isClosed ? "grayscale opacity-50" : ""
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm avatar-ring ${
                          isClosed ? "grayscale opacity-50" : ""
                        }`}
                      >
                        {otherParticipant.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Active indicator dot */}
                    {!isClosed && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`font-semibold text-sm truncate ${
                            isActive ? "text-primary" : "text-foreground"
                          } ${isClosed ? "opacity-50" : ""}`}
                        >
                          {otherParticipant.name}
                        </span>
                        {isClosed && (
                          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 px-1.5 py-0.5 rounded-full">
                            Closed
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {timeString}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs truncate ${
                          hasUnread
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {lastMsgContent}
                      </p>
                      {hasUnread && (
                        <span className="unread-badge shrink-0">●</span>
                      )}
                    </div>
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
