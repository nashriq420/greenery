"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Star,
  MapPin,
  Calendar,
  MessageCircle,
  Clock,
  Search,
  Check,
  Store,
} from "lucide-react";
import dynamic from "next/dynamic";

const SellerLocationMap = dynamic(
  () => import("@/components/SellerLocationMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-gray-100 animate-pulse" />
    ),
  },
);

export default function SellerProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuthStore();

  const [seller, setSeller] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Menus");

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const sellerData = await api.get(
          `/marketplace/sellers/${id}`,
        );
        setSeller(sellerData);
        const allListings = await api.get(
          "/marketplace/listings",
        );
        if (Array.isArray(allListings)) {
          const sellerListings = allListings.filter(
            (l: any) => l.seller.id === id,
          );
          setListings(sellerListings);
        }
        const sellerReviews = await api.get(
          `/reviews/seller/${id}`,
        );
        setReviews(sellerReviews);
      } catch (e) {
        console.error("Error fetching seller profile:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ...

  // Helper to safety check banner url or use default
  const bannerUrl =
    seller?.sellerProfile?.bannerUrl ||
    "https://images.unsplash.com/photo-1603569283847-aa295f0d016a?q=80&w=1000&auto=format&fit=crop";

  // Helper to parse Opening Hours
  const openingHours = seller?.sellerProfile?.openingHours || "";
  const [days, timeRange] = openingHours
    .split("|")
    .map((s: string) => s.trim());

  if (loading)
    return (
      // ...
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );

  if (!seller)
    return (
      <div className="p-8 text-center text-xl text-gray-500">
        Seller not found.
      </div>
    );

  const joinedDate = new Date(seller.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const rating = seller.averageRating
    ? Number(seller.averageRating).toFixed(1)
    : "New";
  const reviewCount = seller.reviewCount || 0;

  return (
    <div className="bg-background min-h-screen pb-20 animate-in fade-in duration-500">
      {/* Banner Area */}
      <div className="relative w-full h-56 md:h-72 bg-muted overflow-hidden">
        <img
          src={bannerUrl}
          alt="Cover Banner"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1603569283847-aa295f0d016a?q=80&w=1000&auto=format&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent"></div>
      </div>

      {/* Profile Header Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-8">
            {/* Profile Picture */}
            <div className="relative z-10 shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-background shadow-xl overflow-hidden bg-muted">
                <img
                  src={
                    seller.profilePicture ||
                    `https://ui-avatars.com/api/?name=${seller.name}&background=random`
                  }
                  alt={seller.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Name and Handle */}
            <div className="flex-1 mt-4 md:mt-0 md:mb-2 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold text-foreground leading-tight tracking-tight">
                      {seller.name}
                    </h1>
                    {seller.subscription?.status === "ACTIVE" && (
                      <div className="flex items-center gap-1.5">
                        <span
                          title="Verified Premium Seller"
                          className="inline-flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </span>
                        <span className="bg-linear-to-r from-yellow-400 to-yellow-600 text-white px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <Star size={10} fill="currentColor" /> Premium
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground font-medium text-lg">
                    @
                    {seller.username ||
                      seller.name.replace(/\s+/g, "").toLowerCase()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 shrink-0">
                  <button className="px-6 py-2.5 bg-card border border-border hover:bg-muted text-foreground font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm">
                    <Star className="w-4 h-4" /> Favorite
                  </button>
                  {user?.id !== id && (
                    <button
                      onClick={async () => {
                        if (!user) return alert("Please login to chat");
                        try {
                          const chat = await api.post(
                            "/chat",
                            { participantId: id },
                          );
                          window.location.href = `/dashboard/chat/${chat.id}`;
                        } catch (e) {
                          alert("Failed to start chat");
                        }
                      }}
                      className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" /> Message
                    </button>
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="mt-6 flex flex-wrap items-center gap-y-3 gap-x-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                  <div className="flex text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <span className="font-bold text-foreground">{rating}</span>
                  <span>({reviewCount} reviews)</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {seller.sellerProfile?.city || "Location hidden"}
                  </span>
                  {seller.sellerProfile?.state && (
                    <span>, {seller.sellerProfile.state}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Joined {joinedDate}</span>
                </div>

                {openingHours ? (
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span>{days}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{timeRange}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 italic">
                    <Clock className="w-4 h-4" />
                    <span>Hours not set</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-border mt-8">
          <nav className="flex -mb-px space-x-8 overflow-x-auto custom-scrollbar">
            {["Home", "Menus", "Reviews", "Show on Map"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-all duration-200
                                    ${
                                      activeTab === tab
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                    }
                                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-8 min-h-[400px]">
          {activeTab === "Home" && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" /> About the Seller
                </h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {seller.sellerProfile?.description ||
                    "No description provided."}
                </p>
              </div>

              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h4 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Location Details
                </h4>
                <div className="space-y-3 text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <span className="font-medium text-foreground w-20">
                      Address:
                    </span>
                    <span>
                      {seller.sellerProfile?.address || "Hidden for privacy"}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-medium text-foreground w-20">
                      City:
                    </span>
                    <span>{seller.sellerProfile?.city || "Unknown"}</span>
                  </div>
                  {seller.sellerProfile?.state && (
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-foreground w-20">
                        State:
                      </span>
                      <span>{seller.sellerProfile?.state}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Menus" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">
                  Active Listings
                </h3>
                <span className="bg-muted text-foreground px-3 py-1 rounded-full text-xs font-bold border border-border">
                  {listings.length} Items
                </span>
              </div>

              {listings.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-card rounded-2xl border border-border shadow-sm">
                  <Store className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium text-foreground">
                    No active listings
                  </p>
                  <p className="text-sm">
                    This seller has not posted any items yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {listings.map((listing) => (
                    <Link
                      href={`/dashboard/marketplace/${listing.id}`}
                      key={listing.id}
                      className="group block h-full"
                    >
                      <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1">
                        <div className="h-48 bg-muted relative overflow-hidden shrink-0">
                          {listing.imageUrl ? (
                            <img
                              src={listing.imageUrl}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              alt={listing.title}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              <span className="text-sm opacity-50">
                                No Image
                              </span>
                            </div>
                          )}
                          {listing.strainType && (
                            <span className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg backdrop-blur-md shadow-sm border border-white/10">
                              {listing.strainType}
                            </span>
                          )}
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1 text-lg">
                            {listing.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-4 line-clamp-1">
                            {listing.type || "Product"}
                          </p>
                          <div className="flex justify-between items-center mt-auto">
                            <p className="text-foreground font-bold text-lg">
                              ${Number(listing.price).toFixed(2)}
                            </p>
                            {listing.minQuantity > 1 && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-muted px-2 py-1 rounded-md border border-border">
                                Min: {listing.minQuantity}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Reviews" && (
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-foreground">
                    Customer Reviews
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    What the community says about {seller.name}
                  </p>
                </div>
                <div className="flex items-center gap-6 divide-x divide-border">
                  <div className="flex flex-col items-center px-4">
                    <div className="flex items-center gap-2 text-yellow-500 font-bold text-3xl">
                      <Star className="fill-current w-7 h-7" /> {rating}
                    </div>
                    <span className="text-muted-foreground text-xs mt-1 uppercase tracking-wider font-bold">
                      Average Rating
                    </span>
                  </div>
                  <div className="flex flex-col items-center px-6">
                    <div className="text-foreground font-bold text-3xl">
                      {reviewCount}
                    </div>
                    <span className="text-muted-foreground text-xs mt-1 uppercase tracking-wider font-bold">
                      Total Reviews
                    </span>
                  </div>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-card rounded-2xl border border-border shadow-sm">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium text-foreground">
                    No reviews yet
                  </p>
                  <p className="text-sm">
                    Be the first to review this seller's products!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
                            <img
                              src={
                                review.customer?.profilePicture ||
                                `https://ui-avatars.com/api/?name=${review.customer?.name}&background=random`
                              }
                              alt={review.customer?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm">
                              {review.customer?.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < review.rating ? "fill-current" : "text-muted/30"}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-lg px-3 py-2 mb-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                          Reviewed Item
                        </p>
                        <Link
                          href={`/dashboard/marketplace/${review.listing?.id}`}
                          className="text-sm font-semibold text-primary hover:underline line-clamp-1"
                        >
                          {review.listing?.title}
                        </Link>
                      </div>

                      <p className="text-foreground/90 text-sm leading-relaxed italic">
                        "{review.comment}"
                      </p>

                      {review.reply && (
                        <div className="mt-4 pl-4 border-l-2 border-primary/20 pt-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <MessageCircle
                                size={10}
                                className="text-primary"
                              />
                            </div>
                            <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                              Seller Reply
                            </p>
                          </div>
                          <p className="text-muted-foreground text-sm italic">
                            "{review.reply}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Show on Map" && (
            <div className="h-[400px] rounded-xl overflow-hidden border border-border shadow-inner">
              {typeof window !== "undefined" &&
                seller.sellerProfile?.latitude && (
                  <SellerLocationMap
                    latitude={seller.sellerProfile.latitude}
                    longitude={seller.sellerProfile.longitude}
                    sellerName={seller.name}
                  />
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
