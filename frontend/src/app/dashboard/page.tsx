"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMyListings, Listing } from "@/hooks/useMarketplace";
import { useEffect, useState } from "react";
import EditListingModal from "@/components/marketplace/EditListingModal";
import ViewListingModal from "@/components/marketplace/ViewListingModal";

const MapComponent = dynamic(() => import("@/components/Map"), { ssr: false });

export default function DashboardPage() {
  const { user, refreshUser } = useAuthStore();
  const router = useRouter();
  const { listings, loading, refetch } = useMyListings();
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [viewingListing, setViewingListing] = useState<Listing | null>(null);

  // Refresh user data on mount to get latest location/subscription status
  useEffect(() => {
    if (refreshUser) refreshUser();
  }, [refreshUser]);

  // Redirect Admin to Admin Dashboard
  useEffect(() => {
    if (user?.role === "ADMIN") {
      router.push("/dashboard/admin");
    }
  }, [user, router]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Overview
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || "User"}! Here's what's happening today.
        </p>
      </div>

      {user?.role === "SELLER" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metric Card 1 */}
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors duration-500"></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Total Listings
              </p>
              <h3 className="text-3xl font-bold text-foreground">
                {listings.length}
              </h3>
            </div>
            <div className="mt-4 flex items-center text-xs text-primary font-medium">
              <span className="flex items-center gap-1">
                Active on Marketplace
              </span>
            </div>
          </div>

          {/* Metric Card 2 */}
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors duration-500"></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Active Status
              </p>
              <h3 className="text-3xl font-bold text-foreground">
                {listings.filter((l) => l.status === "ACTIVE").length}
              </h3>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span>Currently live and approved</span>
            </div>
          </div>

          {/* Metric Card 3 */}
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors duration-500"></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Store Location
              </p>
              <h3 className="text-lg font-bold text-foreground leading-tight line-clamp-2">
                {user?.sellerProfile?.city
                  ? `${user.sellerProfile.city}, ${user.sellerProfile.state || user.sellerProfile.country}`
                  : "Not Set"}
              </h3>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium">
              {user?.sellerProfile?.address ? (
                <Link
                  href="/dashboard/profile"
                  className="text-primary hover:underline"
                >
                  Manage Location
                </Link>
              ) : (
                <Link
                  href="/dashboard/profile"
                  className="text-yellow-600 dark:text-yellow-500 hover:underline"
                >
                  Setup Required
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Listings */}
        {user?.role === "SELLER" && (
          <div className="lg:col-span-1 border border-border rounded-2xl bg-card shadow-sm flex flex-col h-[500px]">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30 rounded-t-2xl">
              <h3 className="font-bold text-lg text-foreground">
                Recent Listings
              </h3>
              <Link
                href="/dashboard/profile"
                className="text-xs text-primary font-medium hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted animate-pulse rounded-lg"
                    ></div>
                  ))}
                </div>
              ) : listings.length > 0 ? (
                listings.slice(0, 5).map((listing) => (
                  <div
                    key={listing.id}
                    className="group flex gap-3 items-center p-3 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-border transition-all"
                  >
                    <div className="w-12 h-12 shrink-0 bg-muted rounded-lg overflow-hidden border border-border/50">
                      {listing.imageUrl ? (
                        <img
                          src={listing.imageUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase font-bold text-center">
                          No Img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                          {listing.title}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs font-bold text-foreground">
                          ${listing.price}
                        </p>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            listing.status === "PENDING"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-900/50"
                              : listing.status === "ACTIVE"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-900/50"
                                : listing.status === "REJECTED"
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/50"
                                  : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {listing.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-muted-foreground text-sm py-10">
                  <p>No listings yet.</p>
                  <Link
                    href="/dashboard/profile"
                    className="mt-2 text-primary hover:underline font-medium"
                  >
                    Create one now
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Column: Map */}
        <div
          className={`border border-border rounded-2xl bg-card shadow-sm flex flex-col h-[500px] overflow-hidden ${user?.role === "SELLER" ? "lg:col-span-2" : "lg:col-span-3"}`}
        >
          <div className="p-6 border-b border-border bg-muted/30">
            <h3 className="font-bold text-lg text-foreground">
              Marketplace Activity
            </h3>
            <p className="text-sm text-muted-foreground">
              Discover other verified sellers in your region.
            </p>
          </div>
          <div className="flex-1 w-full bg-muted relative">
            <MapComponent />
          </div>
        </div>
      </div>

      {editingListing && (
        <EditListingModal
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onUpdate={refetch}
        />
      )}

      {viewingListing && (
        <ViewListingModal
          listing={viewingListing}
          onClose={() => setViewingListing(null)}
        />
      )}
    </div>
  );
}
