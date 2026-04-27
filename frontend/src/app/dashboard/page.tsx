"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMyListings, useSellers, Listing } from "@/hooks/useMarketplace";
import { useEffect, useState } from "react";
import EditListingModal from "@/components/marketplace/EditListingModal";
import ViewListingModal from "@/components/marketplace/ViewListingModal";
import { api } from "@/lib/api";
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
  ChevronRight,
  Clock,
  Check,
  ChevronDown,
  Heart,
} from "lucide-react";

const MapComponent = dynamic(() => import("@/components/Map"), { ssr: false });

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
  tag?: string | null;
}

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

function checkIsOpen(openingHoursStr?: string | null) {
  if (!openingHoursStr) return { isOpen: true, text: "Open now (default)" }; 
  try {
    const hours = JSON.parse(openingHoursStr);
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayStr = dayNames[new Date().getDay()];
    const todayHours = hours[todayStr];
    if (!todayHours || todayHours.closed) return { isOpen: false, text: "Closed today" };
    
    let openStr = "";
    let closeStr = "";
    if (typeof todayHours === "string") {
      [openStr, closeStr] = todayHours.split("-");
    } else {
      openStr = todayHours.open || todayHours.start;
      closeStr = todayHours.close || todayHours.end;
    }
    
    if (!openStr || !closeStr) return { isOpen: true, text: "Open today" };
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [openH, openM] = openStr.split(":").map(Number);
    const [closeH, closeM] = closeStr.split(":").map(Number);
    
    const openMinutes = openH * 60 + (openM||0);
    const closeMinutes = closeH * 60 + (closeM||0);
    
    if(currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
       return { isOpen: true, text: `Open until ${closeStr}` };
    }
    return { isOpen: false, text: `Closed (Opens ${openStr})` };
  } catch(e) {
    return { isOpen: true, text: "Open now" }; // Default fallback if not parseable JSON
  }
}

function getBannerUrl(url?: string | null) {
  if (!url) return "https://images.unsplash.com/photo-1603908866179-8d145eb5b290?auto=format&fit=crop&q=80&w=400&h=200";
  if (url.startsWith("http")) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL === "/api" ? "http://localhost:4000" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");
  return `${baseUrl}${url}`;
}

export default function DashboardPage() {
  const { user, refreshUser, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { listings, loading, refetch } = useMyListings();
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [viewingListing, setViewingListing] = useState<Listing | null>(null);
  
  const [mapView, setMapView] = useState(true);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showVendorsOfWeek, setShowVendorsOfWeek] = useState(true);

  const { sellers, loading: loadingSellers } = useSellers(userLocation?.lat, userLocation?.lng, 50);

  // Mock Vendors of the week
  const vendorsOfTheWeek = [
    {
      id: "1",
      name: "GreenLeaf Dispensary",
      location: "Perth CBD",
      rating: 4.9,
      reviews: 128,
      image: "https://images.unsplash.com/photo-1603908866179-8d145eb5b290?auto=format&fit=crop&q=80&w=200&h=150",
    },
    {
      id: "2",
      name: "HighLife Collective",
      location: "Northbridge",
      rating: 4.8,
      reviews: 112,
      isPremium: true,
      image: "https://images.unsplash.com/photo-1556928045-16f7f50be0f3?auto=format&fit=crop&q=80&w=200&h=150",
    },
    {
      id: "3",
      name: "Organic Herb Shop",
      location: "East Perth",
      rating: 4.7,
      reviews: 105,
      isPremium: true,
      image: "https://images.unsplash.com/photo-1589363460779-cb715ff2886f?auto=format&fit=crop&q=80&w=200&h=150",
    },
  ];

  // Refresh user data
  useEffect(() => {
    if (refreshUser) refreshUser();
  }, [refreshUser]);

  // Admin redirect
  useEffect(() => {
    if (user?.role === "ADMIN") {
      router.push("/dashboard/admin");
    }
  }, [user, router]);

  // Fetch Community Feed
  useEffect(() => {
    const fetchFeed = async () => {
      setLoadingPosts(true);
      try {
        const data = await api.get("/community/feed");
        if (Array.isArray(data)) {
          setCommunityPosts(data.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to fetch community feed", error);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchFeed();
  }, [isAuthenticated]);

  // Handle Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => {
          console.warn("Geolocation failed or denied, using fallback", error);
          if (user?.sellerProfile?.latitude && user?.sellerProfile?.longitude) {
            setUserLocation({ lat: user.sellerProfile.latitude, lng: user.sellerProfile.longitude });
          }
        }
      );
    } else {
      if (user?.sellerProfile?.latitude && user?.sellerProfile?.longitude) {
        setUserLocation({ lat: user.sellerProfile.latitude, lng: user.sellerProfile.longitude });
      }
    }
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/marketplace?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const quickActions = [
    {
      icon: ShoppingBag,
      label: "Browse Marketplace",
      subLabel: "Explore all vendors",
      href: "/dashboard/marketplace",
      color: "text-emerald-500",
      bgClass: "bg-emerald-500/10",
      hoverClass: "group-hover:bg-emerald-500/20"
    },
    {
      icon: MessageSquare,
      label: "View Messages",
      subLabel: "Check your inbox",
      href: "/dashboard/chat",
      color: "text-blue-500",
      bgClass: "bg-blue-500/10",
      hoverClass: "group-hover:bg-blue-500/20"
    },
    {
      icon: MapPin,
      label: "Nearby Sellers",
      subLabel: "Find items close to you",
      href: "/dashboard/marketplace", // Could add ?nearby=true later
      color: "text-purple-500",
      bgClass: "bg-purple-500/10",
      hoverClass: "group-hover:bg-purple-500/20"
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary/95 to-primary/80 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/5 blur-3xl translate-x-12 -translate-y-12" />
        <div className="absolute left-0 bottom-0 w-64 h-64 rounded-full bg-white/5 blur-3xl -translate-x-12 translate-y-12" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-5 h-5 opacity-90" />
            <span className="text-sm font-semibold opacity-90 tracking-wide uppercase">BudPlug Marketplace</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            Welcome back, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-base opacity-80 max-w-lg font-medium">
            {user?.role === "SELLER"
              ? "Manage your store, track listings and respond to your customers."
              : "Discover trusted local vendors and the finest sustainable products near you."}
          </p>
          <form onSubmit={handleSearch} className="mt-6 flex items-center max-w-xl bg-white/10 backdrop-blur-md rounded-full p-1.5 focus-within:ring-2 focus-within:ring-white/50 shadow-lg border-0 outline-none ring-0">
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search for herbs, products, or vendors" 
              className="w-full bg-transparent text-white placeholder:text-white/70 px-4 py-2 font-medium border-0 border-transparent shadow-none outline-none focus:outline-none focus:ring-0 focus:border-transparent" 
            />
            <button type="submit" className="bg-white text-primary px-6 py-2.5 rounded-full font-bold hover:bg-white/90 transition shadow-sm">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* VENDORS NEAR YOU */}
      {(!user || user.role !== "SELLER") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <div>
                <h2 className="text-lg font-bold text-foreground">Vendors Near You</h2>
                <p className="text-sm text-muted-foreground font-medium">Discover verified sellers close to your location.</p>
             </div>
             <Link href="/dashboard/marketplace" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                View all vendors <ArrowRight className="w-4 h-4" />
             </Link>
          </div>
          
          <div className="flex gap-5 overflow-x-auto pb-4 custom-scrollbar snap-x">
             {loadingSellers ? (
                [1, 2, 3].map(i => <div key={i} className="min-w-[280px] h-[340px] rounded-2xl bg-muted shrink-0 animate-pulse border border-border" />)
             ) : sellers.length > 0 ? (
                sellers.map((seller) => (
                   <div key={seller.id} className="min-w-[300px] max-w-[320px] bg-card border border-border rounded-2xl shadow-soft snap-start shrink-0 flex flex-col group hover:border-primary/40 hover:shadow-md transition-all overflow-hidden">
                      
                      {/* Top Banner Area */}
                      <div className="h-32 w-full bg-muted relative">
                          <img src={getBannerUrl(seller.bannerUrl)} alt="Cover" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-linear-to-t from-background/90 via-background/20 to-transparent" />
                          
                          {/* Distance Badge */}
                          {seller.distance !== undefined && (
                             <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                <MapPin className="w-3 h-3 text-green-400" />
                                {seller.distance.toFixed(1)} km away
                             </div>
                          )}
                      </div>

                      <div className="px-5 pb-5 pt-0 flex flex-col flex-1 relative z-10">
                         {/* Avatar overlapping banner */}
                         <div className="w-16 h-16 rounded-full bg-card p-1 shadow-sm -mt-8 mb-2 shrink-0 border border-border">
                            <img src={seller.profilePicture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(seller.name)} alt={seller.name} className="w-full h-full rounded-full object-cover" />
                         </div>
                         
                         {/* Info Title */}
                         <div>
                            <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">{seller.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">{seller.city || "Local Area"}</p>
                         </div>
                         
                         {/* Verified Seller Badge */}
                         {seller.subscriptionStatus === "ACTIVE" && (
                            <div className="mt-2 inline-flex items-center gap-1 bg-green-500/10 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-sm w-fit border border-green-500/20">
                               <Check className="w-3 h-3" /> Verified Seller
                            </div>
                         )}

                         {/* Mock Categories */}
                         <div className="flex flex-wrap gap-2 mt-3 mb-4">
                            {["Flower", "Tinctures", "Topicals"].map((cat) => (
                               <span key={cat} className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
                                  {cat}
                               </span>
                            ))}
                         </div>

                         {/* Footer Row (Rating & Open Status) */}
                         <div className="flex items-center justify-between mt-auto pt-2">
                             <div className="flex items-center gap-1.5">
                                 <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                 <span className="font-extrabold text-sm text-foreground">{seller.averageRating ? seller.averageRating.toFixed(1) : "5.0"}</span>
                                 <span className="text-xs text-muted-foreground">({seller.reviewCount || 0} reviews)</span>
                             </div>
                             <span className={`text-xs font-bold ${checkIsOpen(seller.openingHours).isOpen ? "text-green-500" : "text-rose-500"}`}>
                                 {checkIsOpen(seller.openingHours).text}
                             </span>
                         </div>

                         {/* Action Buttons */}
                         <div className="flex items-center gap-2 mt-4">
                            <Link href={`/dashboard/seller/${seller.userId}`} className="flex-1 bg-primary/10 hover:bg-primary text-primary hover:text-white text-sm font-bold py-2.5 rounded-xl text-center transition-all shadow-sm">
                               View Vendor
                            </Link>
                            <button className="w-10 h-10 flex items-center justify-center border border-border rounded-xl text-muted-foreground hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 transition-colors">
                               <Heart className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                   </div>
                ))
             ) : (
                <div className="w-full text-center py-10 bg-muted/30 rounded-2xl border border-border border-dashed">
                   <p className="text-muted-foreground font-medium text-sm">No vendors found nearby</p>
                </div>
             )}
          </div>
        </div>
      )}

      {/* SELLER METRICS (Only for Sellers) */}
      {user?.role === "SELLER" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between shadow-soft relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Listings</p>
                <h3 className="text-4xl font-extrabold text-foreground">{listings.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <LayoutGrid className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-5 flex items-center text-sm text-primary font-semibold">
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Active on Marketplace
            </div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between shadow-soft relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Active Status</p>
                <h3 className="text-4xl font-extrabold text-foreground">{listings.filter((l) => l.status === "ACTIVE").length}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-5 flex items-center text-sm text-muted-foreground font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2 animate-pulse" />
              Live & approved
            </div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between shadow-soft relative overflow-hidden group hover:border-purple-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Store Location</p>
                <h3 className="text-xl font-extrabold text-foreground leading-tight line-clamp-2">
                  {user?.sellerProfile?.city ? `${user.sellerProfile.city}, ${user.sellerProfile.state || user.sellerProfile.country}` : "Not Set"}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-5 flex items-center text-sm font-semibold">
              {user?.sellerProfile?.address ? (
                <Link href="/dashboard/profile" className="text-primary hover:underline flex items-center gap-1">
                  Manage Location <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link href="/dashboard/profile" className="text-amber-500 hover:underline flex items-center gap-1">
                  ⚠ Setup Required
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. QUICK ACTIONS (Now larger and stacked cleaner on mobile) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground px-1">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className="bg-card border border-border rounded-2xl p-5 shadow-soft hover:shadow-md transition-all duration-300 group hover:-translate-y-1 flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${action.bgClass} ${action.hoverClass}`}>
                <action.icon className={`w-7 h-7 ${action.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{action.label}</h3>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">{action.subLabel}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 3. MAP SECTION (Col-span 8 on Desktop) - Includes Vendors of the week */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col border border-border rounded-3xl bg-card shadow-soft overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Explore Marketplace</h2>
                <p className="text-sm text-muted-foreground mt-1 font-medium">
                  {userLocation ? "Discovering trusted vendors near you" : "Using fallback location"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-muted/60 p-1.5 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => setMapView(true)}
                  className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-all ${mapView ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Map className="w-4 h-4" /> Map
                </button>
                <button
                  onClick={() => setMapView(false)}
                  className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-all ${!mapView ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <LayoutGrid className="w-4 h-4" /> List
                </button>
              </div>
            </div>

            {/* Map / List View Container */}
            <div className="relative">
              {/* VENDORS OF THE WEEK OVERLAY (Horizontal Scroll) */}
              {mapView && (
                <div className="absolute top-4 left-0 w-full z-1000 px-4 pointer-events-none">
                  <div className="mb-2 px-2 flex items-center justify-between pointer-events-auto">
                    <button onClick={() => setShowVendorsOfWeek(!showVendorsOfWeek)} className="flex items-center gap-1.5 focus:outline-none group">
                       <h3 className="text-sm font-bold text-foreground/90 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full shadow-sm tracking-wide group-hover:text-primary transition-colors">
                         Vendors of the Week
                       </h3>
                       <div className="bg-background/80 backdrop-blur-md p-1 rounded-full shadow-sm">
                          <ChevronDown className={`w-4 h-4 text-foreground/80 transition-transform duration-300 ${showVendorsOfWeek ? 'rotate-180' : ''}`} />
                       </div>
                    </button>
                     <Link href="/dashboard/marketplace" className="text-xs font-bold text-primary bg-background/80 backdrop-blur-md px-3 py-1 rounded-full shadow-sm hover:underline flex items-center gap-1">
                        View all <ArrowRight className="w-3 h-3" />
                     </Link>
                  </div>
                  {/* Horizontal scroll container */}
                  <div className={`transition-all duration-300 ease-in-out origin-top ${showVendorsOfWeek ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0 overflow-hidden'}`}>
                    <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 px-2 pointer-events-auto snap-x">
                      {vendorsOfTheWeek.map((vendor) => (
                        <div key={vendor.id} className="min-w-[240px] max-w-[280px] bg-card/95 backdrop-blur-md border border-border/60 rounded-2xl p-3 shadow-md snap-start flex items-center gap-3 shrink-0 hover:bg-card hover:border-primary/40 transition-colors cursor-pointer group">
                           <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative">
                             <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-foreground text-sm truncate">{vendor.name}</h4>
                              <p className="text-xs text-muted-foreground truncate">{vendor.location}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center text-xs font-bold text-amber-500">
                                   <Star className="w-3 h-3 mr-0.5 fill-amber-500" /> {vendor.rating}
                                </div>
                                <span className="text-[10px] text-muted-foreground">({vendor.reviews})</span>
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {mapView ? (
                 <div className="w-full bg-muted">
                    <MapComponent />
                 </div>
              ) : (
                 <div className="h-[400px] w-full bg-muted/30 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                       <ShoppingBag className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-extrabold text-foreground mb-2">Explore the List</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">Switch to the marketplace tab to view the full directory of sellers near {userLocation ? "your location" : "you"}.</p>
                    <Link href="/dashboard/marketplace" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold shadow-sm transition-all focus:ring-4 focus:ring-primary/20 flex items-center gap-2">
                       Browse Vendors <ArrowRight className="w-4 h-4" />
                    </Link>
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. COMMUNITY ACTIVITY (Col-span 4 on Desktop) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-border rounded-3xl bg-card shadow-soft h-full flex flex-col max-h-[500px] lg:max-h-[calc(400px+88px)] overflow-hidden">
             <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                <div>
                   <h2 className="text-lg font-bold text-foreground">Community Activity</h2>
                   <p className="text-xs text-muted-foreground mt-1 font-medium">Live updates from BudPlug</p>
                </div>
                <Link href="/dashboard/community" className="text-sm font-bold text-primary hover:underline">
                    View all
                </Link>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
               {loadingPosts ? (
                 [1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                       <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                       <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                       </div>
                    </div>
                 ))
               ) : communityPosts.length > 0 ? (
                 communityPosts.map((post) => (
                   <Link key={post.id} href={`/dashboard/community#${post.id}`} className="group flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                         <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                           <span className="font-bold">{post.author.name}</span> posted: {post.content}
                         </p>
                         <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {timeAgo(new Date(post.createdAt))}
                         </div>
                      </div>
                   </Link>
                 ))
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center py-8">
                     <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
                     <p className="text-foreground font-bold text-sm">No recent activity</p>
                     <p className="text-muted-foreground text-xs mt-1">Be the first to post something!</p>
                     <Link href="/dashboard/community" className="mt-4 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-colors">
                        Go to Community
                     </Link>
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* 5. SELLER LISTINGS (Only for Sellers - moved below) */}
        {user?.role === "SELLER" && (
           <div className="lg:col-span-12 border border-border rounded-3xl bg-card shadow-soft overflow-hidden">
               <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Your Recent Listings</h2>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Manage your marketplace presence</p>
                  </div>
                  <Link href="/dashboard/profile" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                      Manage All <ArrowRight className="w-4 h-4" />
                  </Link>
               </div>
               
               <div className="p-6">
                 {loading ? (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                       {[1, 2, 3].map(i => <div key={i} className="w-[300px] h-[100px] rounded-2xl bg-muted shrink-0 animate-pulse" />)}
                    </div>
                 ) : listings.length > 0 ? (
                    <div className="flex gap-5 overflow-x-auto pb-4 custom-scrollbar snap-x">
                        {listings.slice(0, 5).map((listing) => (
                           <div key={listing.id} onClick={() => setViewingListing(listing)} className="min-w-[320px] max-w-[350px] flex gap-4 items-center p-4 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group snap-start">
                              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-muted">
                                  {listing.imageUrl ? (
                                      <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center"><Leaf className="w-6 h-6 text-muted-foreground/40" /></div>
                                  )}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="font-bold text-sm truncate text-foreground group-hover:text-primary transition-colors">{listing.title}</p>
                                 <p className="text-sm font-extrabold text-foreground mt-0.5">RM {listing.price}</p>
                                 <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-widest ${
                                    listing.status === "ACTIVE" ? "bg-green-500/10 text-green-600 border border-green-500/20" : 
                                    listing.status === "PENDING" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : 
                                    "bg-muted text-muted-foreground"
                                 }`}>
                                    {listing.status}
                                 </span>
                              </div>
                           </div>
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-10">
                       <p className="text-muted-foreground font-medium text-sm mb-4">No listings created yet. Start selling!</p>
                       <Link href="/dashboard/marketplace" className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl inline-flex items-center gap-2 hover:bg-primary/90 transition-colors">
                          <ShoppingBag className="w-4 h-4" /> Create Listing
                       </Link>
                    </div>
                 )}
               </div>
           </div>
        )}
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
