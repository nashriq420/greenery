"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  Check,
  Info,
  MessageSquare,
  Star,
  AlertTriangle,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { playNotificationSound } from "@/lib/sound";

interface Notification {
  id: string;
  type: "CHAT" | "REVIEW" | "WARNING" | "SYSTEM";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationMenu() {
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const previousUnreadCountRef = useRef(0);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await api.get("/notifications", token);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);

      if (data.unreadCount > previousUnreadCountRef.current) {
        // New notification arrived
        playNotificationSound();

        // Find newest unread notification
        const newNotification = data.notifications.find(
          (n: Notification) => !n.read,
        );
        if (newNotification) {
          toast.success(`New Notification: ${newNotification.title}`, {
            icon: "🔔",
          });
        } else {
          toast.success("You have new notifications", { icon: "🔔" });
        }
      }
      previousUnreadCountRef.current = data.unreadCount;
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  // Poll for notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleMarkAsRead = async (id: string, link?: string) => {
    if (!token) return;
    try {
      await api.put(`/notifications/${id}/read`, {}, token);
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (link) {
        setIsOpen(false);
        router.push(link);
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await api.put("/notifications/read-all", {}, token);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "CHAT":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "REVIEW":
        return <Star className="w-4 h-4 text-yellow-500" />;
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-card border-border rounded-lg shadow-xl border z-[1100] overflow-hidden">
          <div className="p-3 border-b border-border flex justify-between items-center bg-muted/50">
            <h3 className="font-semibold text-sm text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-xs text-primary hover:text-primary/70 font-medium flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() =>
                      handleMarkAsRead(notification.id, notification.link)
                    }
                    className={`p-3 hover:bg-muted cursor-pointer transition-colors ${!notification.read ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1 shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${!notification.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground/80 mt-0.5 wrap-break-words">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {new Date(
                            notification.createdAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="shrink-0 mt-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
