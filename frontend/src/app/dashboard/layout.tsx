"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import NotificationMenu from "@/components/NotificationMenu";
import MobileMenu from "@/components/MobileMenu";
import ProfileMenu from "@/components/ProfileMenu";
import ChatIcon from "@/components/ChatIcon";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Detect chat routes — chat manages its own full-height layout, no outer padding needed
  const isChatRoute = pathname?.startsWith("/dashboard/chat");

  useEffect(() => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border h-16 flex items-center px-4 md:px-6 justify-between bg-white dark:bg-[#0B3D2E] sticky top-0 z-1000">
        <div className="font-bold text-lg md:text-xl text-green-700 flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="BudPlug Logo" className="h-7 w-7 md:h-8 md:w-8 object-contain rounded-full" />
          <span className="hidden sm:inline">BudPlug</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium hover:text-green-600"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/marketplace"
            className="text-sm font-medium hover:text-green-600"
          >
            Marketplace
          </Link>
          <Link
            href="/dashboard/vendors"
            className="text-sm font-medium hover:text-green-600"
          >
            Vendors
          </Link>
          <Link
            href="/dashboard/community"
            className="text-sm font-medium hover:text-green-600"
          >
            Community
          </Link>
          <Link
            href="/dashboard/blacklist"
            className="text-sm font-medium hover:text-red-600"
          >
            Safety
          </Link>
          {user?.role === "ADMIN" && (
            <Link
              href="/dashboard/admin"
              className="text-sm font-medium hover:text-green-600"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5 md:gap-4">
          <ThemeToggle />
          <ChatIcon />
          <NotificationMenu />
          <ProfileMenu user={user} onLogout={handleLogout} />
          {/* Mobile Menu Toggle */}
          <MobileMenu user={user} onLogout={handleLogout} />
        </div>
      </header>
      <main
        className={`flex-1 bg-gray-50 dark:bg-background overflow-hidden ${
          isChatRoute ? "p-0" : "p-6"
        }`}
      >
        {children}
      </main>
      {!isChatRoute && <Footer />}
    </div>
  );
}
