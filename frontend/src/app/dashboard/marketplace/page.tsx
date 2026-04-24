"use client";

import { useState } from "react";
import { useListings, createListing, useSellers } from "@/hooks/useMarketplace";
import { calculateDistance } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MapPin, Check, Search, Filter, X, Star, Store, Award } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PRODUCT_TYPES = [
  "Concentrates",
  "Clones",
  "Extract",
  "Edible",
  "Flower",
  "Topicals",
  "Grow",
  "Gear",
  "Preroll",
  "Smoking",
  "Tinctures",
  "Vaporizers",
  "Unidentified",
  "Others",
];

export default function MarketplacePage() {
  const { user, token } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false); // Modal for missing location

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    imageUrl: "",
    deliveryAvailable: false,
    minQuantity: "1",

    strainType: "",
    thcContent: "",
    cbdContent: "",
    type: "",
    flavors: "",
    effects: "",
    sku: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Location & View State
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Success Message State
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const searchParams = useSearchParams();
  const rawSearchParam = searchParams?.get("search") || "";

  // Valid Filter State
  const [filters, setFilters] = useState({
    search: rawSearchParam,
    minPrice: "",
    maxPrice: "",
    strainType: "",
    type: "",
    deliveryAvailable: false,
    thcMin: "",
    cbdMin: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pass location params to hook
  const { listings, loading, refetch } = useListings({
    ...filters,
    lat: userLocation?.lat,
    lng: userLocation?.lng,
    radius: 50,
  });

  // Fetch Sellers for "Vendor Near You" Sidebar
  const { sellers: nearbySellers, loading: sellersLoading } = useSellers(
    userLocation?.lat,
    userLocation?.lng,
    50,
  );

  // Process Sellers
  const vendorOfTheWeek = nearbySellers.length > 0 
    ? [...nearbySellers].sort((a, b) => {
        // Prefer premium sellers, then highest rating
        if (a.subscriptionStatus === "ACTIVE" && b.subscriptionStatus !== "ACTIVE") return -1;
        if (b.subscriptionStatus === "ACTIVE" && a.subscriptionStatus !== "ACTIVE") return 1;
        return (b.averageRating || 0) - (a.averageRating || 0);
      })[0] 
    : null;

  const premiumSellers = nearbySellers
    .filter((s) => s.subscriptionStatus === "ACTIVE" && s.id !== vendorOfTheWeek?.id)
    .slice(0, 5);

  const topRatedSellers = nearbySellers
    .filter(
      (s) =>
        s.subscriptionStatus !== "ACTIVE" &&
        s.id !== vendorOfTheWeek?.id &&
        s.averageRating &&
        s.averageRating > 0,
    )
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 5);

  // Sort listings by distance if location is available
  const sortedListings = [...listings].sort((a, b) => {
    if (!userLocation) return 0;

    const getDist = (l: typeof a) => {
      if (
        l.seller.sellerProfile?.latitude &&
        l.seller.sellerProfile?.longitude
      ) {
        return calculateDistance(
          userLocation.lat,
          userLocation.lng,
          l.seller.sellerProfile.latitude,
          l.seller.sellerProfile.longitude,
        );
      }
      return Infinity;
    };

    return getDist(a) - getDist(b);
  });

  // Helper to fallback to profile location
  const fallbackToProfileLocation = () => {
    if (user?.sellerProfile?.latitude && user?.sellerProfile?.longitude) {
      setUserLocation({
        lat: user.sellerProfile.latitude,
        lng: user.sellerProfile.longitude,
      });
      setLocationError(null);
    } else {
      // Give up and prompt the user to update settings
      setShowLocationPrompt(true);
      setLocationError(null); // Clear inline error since we show a modal
    }
  };

  const handleUseLocation = () => {
    if (userLocation) {
      // Toggle off
      setUserLocation(null);
      return;
    }

    if (!navigator.geolocation) {
      fallbackToProfileLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      },
      () => {
        // If browser denies permission or fails, fallback to profile
        fallbackToProfileLocation();
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    try {
      await createListing(
        {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          deliveryAvailable: formData.deliveryAvailable,
          minQuantity: parseInt(formData.minQuantity) || 1,
          strainType: formData.strainType || undefined,
          thcContent: formData.thcContent
            ? parseFloat(formData.thcContent)
            : undefined,
          cbdContent: formData.cbdContent
            ? parseFloat(formData.cbdContent)
            : undefined,
          imageUrl: formData.imageUrl || undefined,
          type: formData.type || undefined,
          flavors: formData.flavors || undefined,
          effects: formData.effects || undefined,
          sku: formData.sku || undefined,
        },
        token,
      );

      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
        price: "",
        imageUrl: "",
        deliveryAvailable: false,
        minQuantity: "1",
        strainType: "",
        thcContent: "",
        cbdContent: "",
        type: "",
        flavors: "",
        effects: "",
        sku: "",
      });
      refetch();
      setShowSuccessMessage(true);
    } catch (error) {
      alert("Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  // Lazy load map to avoid server-side issues with Leaflet
  const ListingMap = dynamic(() => import("@/components/ListingMap"), {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
        Loading Map...
      </div>
    ),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl font-bold">Marketplace</h1>

          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={handleUseLocation}
              className={`px-3 py-1.5 rounded-lg text-sm border flex items-center gap-2 ${
                userLocation
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-card border-border text-foreground hover:bg-muted"
              }`}
            >
              <MapPin size={16} />
              {userLocation ? "Nearby (50km)" : "My Location"}
            </button>

            <div className="flex bg-muted p-1 rounded-lg border border-border">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-md text-sm transition ${viewMode === "grid" ? "bg-card shadow-sm font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-3 py-1.5 rounded-md text-sm transition ${viewMode === "map" ? "bg-card shadow-sm font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Map
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-2 ${showFilters ? "bg-muted" : ""}`}
            >
              <Filter size={16} />
              Filters
            </Button>

            {user?.role === "SELLER" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
              >
                + Listing
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Panel */}
        <div className="space-y-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Search listings..."
              className="pl-10 bg-card"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>

          {showFilters && (
            <div className="p-4 bg-muted rounded-lg border grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="text-xs font-semibold mb-1.5 block text-foreground">
                  Price Range
                </label>
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Min"
                    className="h-8 bg-background text-foreground border-input"
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, minPrice: e.target.value })
                    }
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    placeholder="Max"
                    className="h-8 bg-background text-foreground border-input"
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, maxPrice: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block text-foreground">
                  Strain Type
                </label>
                <select
                  className="w-full h-8 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={filters.strainType}
                  onChange={(e) =>
                    setFilters({ ...filters, strainType: e.target.value })
                  }
                >
                  <option value="">Any</option>
                  <option value="Indica">Indica</option>
                  <option value="Sativa">Sativa</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block text-foreground">
                  Type
                </label>
                <select
                  className="w-full h-8 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={filters.type || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value })
                  }
                >
                  <option value="">Any</option>
                  {PRODUCT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block text-foreground">
                  Potency (Min %)
                </label>
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="THC"
                    className="h-8 bg-background text-foreground border-input"
                    type="number"
                    value={filters.thcMin}
                    onChange={(e) =>
                      setFilters({ ...filters, thcMin: e.target.value })
                    }
                  />
                  <Input
                    placeholder="CBD"
                    className="h-8 bg-background text-foreground border-input"
                    type="number"
                    value={filters.cbdMin}
                    onChange={(e) =>
                      setFilters({ ...filters, cbdMin: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer bg-card px-3 py-1.5 border border-border rounded-md w-full h-8 justify-center hover:bg-muted text-foreground">
                  <input
                    type="checkbox"
                    checked={filters.deliveryAvailable}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        deliveryAvailable: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm font-medium">Delivery Only</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {locationError && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded border border-red-200 text-sm">
          {locationError}
        </div>
      )}

      {/* Main Content Grid with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Listings Area */}
        <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedListings.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center text-center py-24 bg-card rounded-2xl border border-dashed border-border/80 px-6 shadow-sm">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-5">
                         <Search className="w-8 h-8 text-muted-foreground/60" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">No matches found</h3>
                      <p className="text-muted-foreground max-w-md">
                        {filters.search 
                          ? `We couldn't find any products, herbs, or vendors matching "${filters.search}". Try adjusting your keywords or filters.` 
                          : "There are currently no active listings available matching your criteria."}
                      </p>
                      {(filters.search || filters.minPrice || filters.maxPrice || filters.strainType || filters.type || filters.deliveryAvailable) && (
                        <Button 
                          variant="outline" 
                          className="mt-6 font-bold rounded-xl" 
                          onClick={() => setFilters({ search: "", minPrice: "", maxPrice: "", strainType: "", type: "", deliveryAvailable: false, thcMin: "", cbdMin: "" })}
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    sortedListings.map((listing) => (
                      <Link
                        href={`/dashboard/marketplace/${listing.id}`}
                        key={listing.id}
                        className="block group h-full"
                      >
                        <div
                          className={`flex flex-col bg-card text-card-foreground border border-border rounded-2xl overflow-hidden transition-all duration-300 h-full ${listing.seller.subscription?.status === "ACTIVE" ? "ring-1 ring-primary/20 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 relative block" : "hover:shadow-lg hover:-translate-y-1 block"}`}
                        >
                          {/* Image Container */}
                          <div className="relative overflow-hidden shrink-0">
                            {listing.seller.subscription?.status ===
                              "ACTIVE" && (
                              <div className="absolute top-3 left-3 bg-linear-to-r from-yellow-400 to-yellow-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm uppercase flex items-center gap-1 z-10 tracking-widest">
                                <Star size={10} fill="currentColor" /> Premium
                              </div>
                            )}
                            {listing.imageUrl ? (
                              <div
                                className={`w-full relative ${listing.seller.subscription?.status === "ACTIVE" ? "h-64" : "h-52"} bg-muted`}
                              >
                                <img
                                  src={listing.imageUrl}
                                  alt={listing.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              </div>
                            ) : (
                              <div
                                className={`w-full ${listing.seller.subscription?.status === "ACTIVE" ? "h-64" : "h-52"} flex items-center justify-center text-muted-foreground bg-muted`}
                              >
                                <span className="opacity-50 text-sm">
                                  No Image Available
                                </span>
                              </div>
                            )}

                            <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
                              {listing.deliveryAvailable && (
                                <div className="bg-black/40 backdrop-blur-md text-white px-2 py-1.5 rounded-lg text-xs font-semibold shadow-sm border border-white/10 uppercase tracking-widest">
                                  Delivery
                                </div>
                              )}
                              <div className="bg-primary/90 backdrop-blur-md text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm border border-primary/20">
                                ${listing.price}
                              </div>
                            </div>
                          </div>

                          {/* Content Container */}
                          <div className="p-5 flex flex-col grow">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                {listing.title}
                              </h3>
                            </div>

                            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1.5 font-medium">
                              <Store size={14} className="opacity-70" />
                              <span className="text-foreground">
                                {listing.seller.name}
                              </span>
                              {listing.seller.subscription?.status ===
                                "ACTIVE" && (
                                <span
                                  title="Verified Premium Seller"
                                  className="inline-flex items-center justify-center w-4 h-4 bg-primary text-primary-foreground rounded-full text-[8px] shadow-sm ml-0.5"
                                >
                                  <Check size={10} strokeWidth={3} />
                                </span>
                              )}
                            </p>

                            {userLocation &&
                              listing.seller.sellerProfile?.latitude &&
                              listing.seller.sellerProfile?.longitude && (
                                <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-3">
                                  <MapPin
                                    size={12}
                                    className="text-primary/70"
                                  />
                                  <span>
                                    {calculateDistance(
                                      userLocation.lat,
                                      userLocation.lng,
                                      listing.seller.sellerProfile.latitude,
                                      listing.seller.sellerProfile.longitude,
                                    ).toFixed(1)}{" "}
                                    km away
                                  </span>
                                  <span className="opacity-30">•</span>
                                  <span className="truncate">
                                    {listing.seller.sellerProfile?.city ||
                                      "Local Area"}
                                  </span>
                                </div>
                              )}
                            {!userLocation &&
                              listing.seller.sellerProfile?.city && (
                                <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-3">
                                  <MapPin
                                    size={12}
                                    className="text-primary/70"
                                  />
                                  <span className="truncate">
                                    {listing.seller.sellerProfile.city}
                                  </span>
                                </div>
                              )}

                            {/* Description */}
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                              {listing.description ||
                                "No description provided."}
                            </p>

                            <div className="mt-auto space-y-3 pt-4 border-t border-border/50">
                              <div className="flex flex-wrap gap-2">
                                {listing.strainType && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/20">
                                    {listing.strainType}
                                  </span>
                                )}
                                {listing.type && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-card text-card-foreground px-2.5 py-1 rounded-md border border-border/60">
                                    {listing.type}
                                  </span>
                                )}
                                {listing.minQuantity &&
                                  listing.minQuantity > 1 && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-card text-card-foreground px-2.5 py-1 rounded-md border border-border/60">
                                      Min Qty: {listing.minQuantity}
                                    </span>
                                  )}
                              </div>

                              {(listing.thcContent || listing.cbdContent) && (
                                <div className="flex gap-4 text-xs font-semibold text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/30">
                                  {listing.thcContent && (
                                    <span className="flex gap-1.5 items-center">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      THC {listing.thcContent}%
                                    </span>
                                  )}
                                  {listing.cbdContent && (
                                    <span className="flex gap-1.5 items-center">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                      CBD {listing.cbdContent}%
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              ) : (
                <ListingMap
                  listings={sortedListings}
                  userLocation={userLocation}
                />
              )}
            </>
          )}
        </div>

        {/* Right Sidebar: Vendor Near You / Top Vendors */}
        <div className="lg:col-span-1 space-y-6 order-1 lg:order-2">
          {/* Vendor of the Week Card */}
          {vendorOfTheWeek && !sellersLoading && (
            <div className="bg-linear-to-br from-primary/20 via-card to-card border border-primary/30 rounded-2xl p-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
              <div className="bg-card/80 backdrop-blur-sm rounded-xl p-5 border border-white/10 dark:border-white/5 h-full relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-primary/20 p-2 rounded-lg text-primary">
                    <Award size={20} className="drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  </div>
                  <h2 className="font-bold text-lg bg-clip-text text-transparent bg-linear-to-r from-primary to-emerald-600 dark:to-emerald-400">
                    Vendor of the Week
                  </h2>
                </div>
                
                <Link href={`/dashboard/seller/${vendorOfTheWeek.userId}`} className="block group/link">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-muted overflow-hidden border-2 border-primary/30 shadow-md shrink-0 relative">
                       {vendorOfTheWeek.subscriptionStatus === "ACTIVE" && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-card z-10">
                            <Check size={12} strokeWidth={3} />
                          </div>
                       )}
                       {vendorOfTheWeek.profilePicture ? (
                        <img
                          src={vendorOfTheWeek.profilePicture}
                          alt={vendorOfTheWeek.name}
                          className="w-full h-full object-cover transition-transform group-hover/link:scale-110 duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-xl bg-primary/5">
                          {vendorOfTheWeek.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-foreground group-hover/link:text-primary transition-colors line-clamp-1">
                        {vendorOfTheWeek.name}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground gap-1.5 mt-1">
                        {vendorOfTheWeek.averageRating && vendorOfTheWeek.averageRating > 0 ? (
                          <span className="flex items-center gap-0.5 text-yellow-600 dark:text-yellow-500 font-bold">
                            <Star size={14} fill="currentColor" /> {Number(vendorOfTheWeek.averageRating).toFixed(1)}
                          </span>
                        ) : (
                          <span className="font-medium">New Vendor</span>
                        )}
                        <span>•</span>
                        <span className="truncate">{vendorOfTheWeek.city || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {vendorOfTheWeek.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                      "{vendorOfTheWeek.description}"
                    </p>
                  )}
                  
                  <div className="w-full py-2 bg-primary/10 group-hover/link:bg-primary/20 text-primary text-center rounded-lg font-bold text-sm transition-colors duration-300">
                    Visit Storefront
                  </div>
                </Link>
              </div>
            </div>
          )}

          <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Store className="text-primary" size={20} />
                {userLocation ? "Vendors Near You" : "Top Vendors"}
              </h2>
            </div>

            {sellersLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {premiumSellers.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Star
                        size={12}
                        className="text-yellow-500"
                        fill="currentColor"
                      />
                      Premium Sellers
                    </h3>
                    <div className="space-y-3">
                      {premiumSellers.map((seller) => (
                        <Link
                          href={`/dashboard/seller/${seller.userId}`}
                          key={seller.id}
                          className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition group"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden border border-primary/20 shrink-0">
                            {seller.profilePicture ? (
                              <img
                                src={seller.profilePicture}
                                alt={seller.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">
                                {seller.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="text-base font-bold truncate group-hover:text-primary transition">
                                {seller.name}
                              </p>
                              <span
                                title="Verified Premium Seller"
                                className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 text-white rounded-full text-[10px] shrink-0"
                              >
                                <Check size={10} strokeWidth={3} />
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground gap-1.5 mt-1">
                              {seller.averageRating &&
                              seller.averageRating > 0 ? (
                                <span className="flex items-center gap-0.5 text-yellow-600 dark:text-yellow-500 font-medium">
                                  <Star size={14} fill="currentColor" />{" "}
                                  {Number(seller.averageRating).toFixed(1)}
                                </span>
                              ) : (
                                <span>New</span>
                              )}
                              <span>•</span>
                              <span className="truncate">
                                {seller.city || "Unknown"}
                              </span>
                            </div>
                            {userLocation && seller.distance !== undefined && (
                              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin size={14} />{" "}
                                {Number(seller.distance).toFixed(1)} km
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {topRatedSellers.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Top Rated
                    </h3>
                    <div className="space-y-3">
                      {topRatedSellers.map((seller) => (
                        <Link
                          href={`/dashboard/seller/${seller.userId}`}
                          key={seller.id}
                          className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition group"
                        >
                          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border shrink-0">
                            {seller.profilePicture ? (
                              <img
                                src={seller.profilePicture}
                                alt={seller.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-medium text-sm">
                                {seller.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold truncate group-hover:text-primary transition">
                              {seller.name}
                            </p>
                            <div className="flex items-center text-sm text-muted-foreground gap-1.5 mt-1">
                              <span className="flex items-center gap-0.5 text-yellow-600 dark:text-yellow-500 font-medium">
                                <Star size={14} fill="currentColor" />{" "}
                                {Number(seller.averageRating).toFixed(1)}
                              </span>
                              <span>•</span>
                              <span className="truncate">
                                {seller.city || "Unknown"}
                              </span>
                            </div>
                            {userLocation && seller.distance !== undefined && (
                              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin size={14} />{" "}
                                {Number(seller.distance).toFixed(1)} km
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {!premiumSellers.length &&
                  !topRatedSellers.length &&
                  !sellersLoading && (
                    <p className="text-sm text-center text-muted-foreground py-4">
                      No top vendors found in this area.
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border shadow-2xl">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <h2 className="text-xl font-bold">Create New Listing</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 ">
                  <label className="text-sm font-semibold text-foreground">
                    Title <span className="text-primary">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. Premium Blue Dream"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Product Type <span className="text-primary">*</span>
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    <option value="">Select...</option>
                    {PRODUCT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Strain Type
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.strainType}
                    onChange={(e) =>
                      setFormData({ ...formData, strainType: e.target.value })
                    }
                  >
                    <option value="">Select...</option>
                    <option value="Indica">Indica</option>
                    <option value="Sativa">Sativa</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    THC (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.thcContent}
                    onChange={(e) =>
                      setFormData({ ...formData, thcContent: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    CBD (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.cbdContent}
                    onChange={(e) =>
                      setFormData({ ...formData, cbdContent: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Flavors
                  </label>
                  <Input
                    value={formData.flavors}
                    onChange={(e) =>
                      setFormData({ ...formData, flavors: e.target.value })
                    }
                    placeholder="E.g. Citrus, Berry"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Effects
                  </label>
                  <Input
                    value={formData.effects}
                    onChange={(e) =>
                      setFormData({ ...formData, effects: e.target.value })
                    }
                    placeholder="E.g. Relaxed, Happy"
                  />
                </div>
              </div>

              {/* Logistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Price ($) <span className="text-primary">*</span>
                  </label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Min Qty
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.minQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, minQuantity: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    SKU
                  </label>
                  <Input
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder="Auto-generated"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pb-2 border-b border-border">
                <label className="flex items-center gap-2 cursor-pointer pb-6">
                  <input
                    type="checkbox"
                    checked={formData.deliveryAvailable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAvailable: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                  />
                  <span className="text-sm font-medium">
                    Delivery Available
                  </span>
                </label>
              </div>

              {/* Long Details */}
              <div className="space-y-6 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold">
                    Description <span className="text-primary">*</span>
                  </label>
                  <textarea
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    rows={4}
                    placeholder="Provide all details, rules, or warnings..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold">
                    Product Image
                  </label>
                  <div className="border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition">
                    <div className="mb-4">
                      {formData.imageUrl ? (
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border shadow-sm group">
                          <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, imageUrl: "" })
                            }
                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-lg border bg-muted flex items-center justify-center text-muted-foreground">
                          <Store className="opacity-20" size={32} />
                        </div>
                      )}
                    </div>
                    <Input
                      type="file"
                      accept="image/png, image/jpeg, image/gif, image/webp"
                      className="max-w-[250px] text-xs file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-3 file:py-1 hover:file:bg-primary/90"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const validTypes = [
                            "image/jpeg",
                            "image/png",
                            "image/gif",
                            "image/webp",
                          ];
                          if (!validTypes.includes(file.type))
                            return alert("Invalid file type.");
                          if (file.size > 5 * 1024 * 1024)
                            return alert("File max 5MB.");

                          setSubmitting(true);
                          const uploadData = new FormData();
                          uploadData.append("image", file);

                          try {
                            const res = await api.upload(
                              "/upload/image",
                              uploadData,
                              token || undefined,
                            );
                            setFormData((prev) => ({
                              ...prev,
                              imageUrl: res.url,
                            }));
                          } catch (err) {
                            alert("Failed to upload image");
                          } finally {
                            setSubmitting(false);
                          }
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG, GIF, WebP up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-border mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Authenticating..." : "Publish Listing"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card text-card-foreground border border-border rounded-lg p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <MapPin size={32} className="text-primary" />
              {/* Reusing MapPin for now, but really need Check icon. Importing types at top. */}
            </div>
            <h2 className="text-xl font-bold mb-2">Listing Submitted!</h2>
            <p className="text-gray-600 mb-6 flex-1 text-sm">
              Your listing has been submitted and is pending approval from an
              admin.
            </p>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Location Prompt Modal */}
      {showLocationPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground border border-border rounded-lg p-6 w-full max-w-sm text-center shadow-xl">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600 dark:text-yellow-500">
              <MapPin size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2">Location Required</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              We couldn&apos;t access your browser&apos;s location and your
              profile doesn&apos;t have a location saved. Please allow browser
              location access or update your location in settings to see vendors
              near you.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard/profile"
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 font-medium transition text-center"
              >
                Go to Settings
              </Link>
              <button
                onClick={() => setShowLocationPrompt(false)}
                className="w-full bg-muted text-foreground px-4 py-2 rounded-lg hover:bg-muted/80 font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
