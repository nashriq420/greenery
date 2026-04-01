"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMyListings, Listing } from "@/hooks/useMarketplace";
import { useEffect, useState } from "react";
import EditListingModal from "@/components/marketplace/EditListingModal";
import ViewListingModal from "@/components/marketplace/ViewListingModal";
import {
  ShoppingBag,
  MessageSquare,
  MapPin,
  LayoutGrid,
  Map,
  Sparkles,
  ArrowRight,
  Leaf,
  TrendingUp,
  Star,
} from "lucide-react";

const MapComponent = dynamic(() => import("@/components/Map"), { ssr: false });

export default function DashboardPage() {
  const { user, refreshUser } = useAuthStore();
  const router = useRouter();
  const { listings, loading, refetch } = useMyListings();
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [viewingListing, setViewingListing] = useState<Listing | null>(null);
  const [mapView, setMapView] = useState(true);

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

  const quickActions = [
    {
      icon: ShoppingBag,
      label: "Browse Marketplace",
      href: "/dashboard/marketplace",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: MessageSquare,
      label: "View Messages",
      href: "/dashboard/chat",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: MapPin,
      label: "Nearby Sellers",
      href: "/dashboard/marketplace",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* ── Welcome Banner ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/90 to-primary/70 p-6 text-white shadow-lg">
        {/* Decorative blobs */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-5 h-5 opacity-80" />
            <span className="text-sm font-medium opacity-80">BudPlug Marketplace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
            Welcome back, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-sm opacity-75 mb-5">
            {user?.role === "SELLER"
              ? "Manage your store, listings and conversations."
              : "Discover sustainable products and connect with local sellers."}
          </p>

        </div>
      </div>

      {/* ── Seller Metric Cards ─────────────────────────────────────── */}
      {user?.role === "SELLER" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Listings */}
          <div className="bg-card p-5 rounded-2xl border border-border flex flex-col justify-between shadow-soft relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors duration-500" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Total Listings
                </p>
                <h3 className="text-3xl font-bold text-foreground">
                  {listings.length}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <LayoutGrid className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-primary font-semibold">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              Active on Marketplace
            </div>
          </div>

          {/* Active Status */}
          <div className="bg-card p-5 rounded-2xl border border-border flex flex-col justify-between shadow-soft relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors duration-500" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Active Listings
                </p>
                <h3 className="text-3xl font-bold text-foreground">
                  {listings.filter((l) => l.status === "ACTIVE").length}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              Currently live and approved
            </div>
          </div>

          {/* Store Location */}
          <div className="bg-card p-5 rounded-2xl border border-border flex flex-col justify-between shadow-soft relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors duration-500" />
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Store Location
                </p>
                <h3 className="text-lg font-bold text-foreground leading-tight line-clamp-2">
                  {user?.sellerProfile?.city
                    ? `${user.sellerProfile.city}, ${user.sellerProfile.state || user.sellerProfile.country}`
                    : "Not Set"}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold">
              {user?.sellerProfile?.address ? (
                <Link
                  href="/dashboard/profile"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Manage Location <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <Link
                  href="/dashboard/profile"
                  className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  ⚠ Setup Required
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Actions (Customer role only) ─────────────────────── */}
      {user?.role !== "SELLER" && (
        <div>
          <p className="section-header">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className="quick-action-card group">
                <div className={`w-12 h-12 rounded-2xl ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <span className="text-sm font-semibold text-foreground">{action.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Content Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Listings (Seller only) */}
        {user?.role === "SELLER" && (
          <div className="lg:col-span-1 border border-border rounded-2xl bg-card shadow-soft flex flex-col h-[420px]">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-base text-foreground">Your Listings</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Recent activity</p>
              </div>
              <Link
                href="/dashboard/profile"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2">
              {loading ? (
                <div className="space-y-3 p-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 items-center p-3 rounded-xl">
                      <div className="skeleton w-12 h-12 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton-text w-3/4" />
                        <div className="skeleton-text w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : listings.length > 0 ? (
                listings.slice(0, 6).map((listing) => (
                  <div
                    key={listing.id}
                    className="group flex gap-3 items-center p-3 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 cursor-pointer"
                    onClick={() => setViewingListing(listing)}
                  >
                    <div className="w-12 h-12 shrink-0 bg-muted rounded-xl overflow-hidden border border-border/50">
                      {listing.imageUrl ? (
                        <img
                          src={listing.imageUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          alt={listing.title}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="w-5 h-5 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                        {listing.title}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs font-bold text-foreground">
                          RM {listing.price}
                        </p>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${listing.status === "PENDING"
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50"
                              : listing.status === "ACTIVE"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50"
                                : listing.status === "REJECTED"
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50"
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
                <div className="h-full flex flex-col justify-center items-center text-center py-10 px-4">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Sparkles className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <p className="font-semibold text-sm text-foreground mb-1">No listings yet</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Create your first listing to start selling on BudPlug.
                  </p>
                  <Link
                    href="/dashboard/marketplace"
                    className="inline-flex items-center gap-1.5 text-xs text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-xl font-semibold transition-all"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Create a Listing
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Column: Map / Marketplace Activity */}
        <div
          className={`border border-border rounded-2xl bg-card shadow-soft flex flex-col overflow-hidden ${user?.role === "SELLER" ? "lg:col-span-2" : "lg:col-span-3"
            }`}
        >
          <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground">Marketplace Activity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mapView
                  ? "Discover verified sellers near you"
                  : "Browse active listings in your region"}
              </p>
            </div>
            {/* Map / List Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              <button
                onClick={() => setMapView(true)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${mapView
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Map className="w-3.5 h-3.5" />
                Map
              </button>
              <button
                onClick={() => setMapView(false)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${!mapView
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                List
              </button>
            </div>
          </div>

          {/* Map View */}
          {mapView ? (
            <div className="h-[320px] w-full bg-muted relative">
              <MapComponent />
            </div>
          ) : (
            /* List View — CTA to browse marketplace */
            <div className="h-[320px] flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground mb-1">Explore the Marketplace</h4>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Browse hundreds of sustainable products from verified local sellers.
                </p>
              </div>
              <Link
                href="/dashboard/marketplace"
                className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary/90 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-soft"
              >
                Browse Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}
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
