'use client';

import { useState, useEffect, useRef } from 'react';
import { User, LogOut, Settings, UserCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProfileMenuProps {
    user: any;
    onLogout: () => void;
}

export default function ProfileMenu({ user, onLogout }: ProfileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                // Defer closing to allow click events on outside targets to register first
                setTimeout(() => {
                    setIsOpen(false);
                }, 10);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const [imageError, setImageError] = useState(false);

    const getProfileImage = () => {
        if (user?.profilePicture && !imageError) return user.profilePicture;
        return null;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 hover:bg-muted p-1.5 rounded-lg transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/30">
                    {getProfileImage() ? (
                        <img
                            src={getProfileImage()}
                            alt={user?.name}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <span className="font-bold text-primary text-sm">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    )}
                </div>
                <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-foreground leading-none">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground leading-none mt-1">@{user?.username || user?.email?.split('@')[0]}</p>
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-xl border border-border z-50 overflow-hidden py-1 text-card-foreground">
                    <div className="px-4 py-3 border-b border-border md:hidden">
                        <p className="text-sm font-medium text-foreground">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>

                    <Link
                        href={`/dashboard/seller/${user?.id}`}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <User className="w-4 h-4 text-muted-foreground" />
                        View Profile
                    </Link>

                    <Link
                        href="/dashboard/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        Profile Settings
                    </Link>

                    <Link
                        href="/dashboard/reports"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <span className="w-4 h-4 flex items-center justify-center text-xs text-muted-foreground">📋</span>
                        My Reports
                    </Link>

                    {user?.role === 'SELLER' && (
                        <Link
                            href="/dashboard/seller/banner"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="w-4 h-4 flex items-center justify-center text-xs text-muted-foreground">📣</span>
                            Promote Products
                        </Link>
                    )}

                    {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                        <Link
                            href="/dashboard/admin/banners"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="w-4 h-4 flex items-center justify-center text-xs text-muted-foreground">🛡️</span>
                            Manage Banners
                        </Link>
                    )}

                    <div className="border-t border-border my-1"></div>

                    <button
                        onClick={() => {
                            setIsOpen(false);
                            onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
