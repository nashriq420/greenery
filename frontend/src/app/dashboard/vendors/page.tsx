"use client";

import { useState, useEffect } from "react";
import { useSellers } from "@/hooks/useMarketplace";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { MapPin, Search, Star, Store, Package, Clock, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function VendorsPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Use user profile location initially if available
  useEffect(() => {
    if (user?.sellerProfile?.latitude && user?.sellerProfile?.longitude) {
      setUserLocation({
        lat: user.sellerProfile.latitude,
        lng: user.sellerProfile.longitude,
      });
    }
  }, [user]);

  const { sellers, loading } = useSellers(userLocation?.lat, userLocation?.lng, 50);

  const filteredSellers = sellers.filter((seller) => 
    seller.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (seller.city && seller.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Store className="text-primary" /> Vendor List
        </h1>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search vendors..." 
            className="pl-10 bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-card rounded-2xl border border-border"></div>
          ))}
        </div>
      ) : filteredSellers.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 bg-card rounded-2xl border border-dashed border-border/80 px-6 shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-5">
            <Store className="w-8 h-8 text-muted-foreground/60" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No vendors found</h3>
          <p className="text-muted-foreground max-w-md">
            There are currently no vendors matching your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSellers.map((seller) => (
            <Link href={`/dashboard/seller/${seller.userId}`} key={seller.id} className="block group">
              <div className={`bg-card text-card-foreground border rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col ${seller.subscriptionStatus === "ACTIVE" ? "border-primary/30 ring-1 ring-primary/20 shadow-md hover:shadow-lg hover:-translate-y-1" : "border-border hover:shadow-md hover:-translate-y-1"}`}>
                
                {/* Header Image */}
                <div className="h-32 w-full bg-muted relative overflow-hidden shrink-0">
                  {seller.subscriptionStatus === "ACTIVE" && (
                    <div className="absolute top-3 left-3 bg-linear-to-r from-yellow-400 to-yellow-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm uppercase flex items-center gap-1 z-10 tracking-widest">
                      <Star size={10} fill="currentColor" /> Premium
                    </div>
                  )}
                  {seller.bannerUrl ? (
                    <img src={seller.bannerUrl} alt={`${seller.name} banner`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-r from-green-800/80 to-green-600/80 flex items-center justify-center">
                      <Store className="text-white/30" size={48} />
                    </div>
                  )}
                </div>

                <div className="p-5 pt-0 relative flex flex-col grow">
                  {/* Profile Picture */}
                  <div className="w-16 h-16 rounded-full bg-card border-4 border-card overflow-hidden absolute -top-8 left-4 shadow-sm">
                    {seller.profilePicture ? (
                      <img src={seller.profilePicture} alt={seller.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                        {seller.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="mt-10 mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors line-clamp-1">{seller.name}</h3>
                      {seller.subscriptionStatus === "ACTIVE" && (
                        <span title="Verified Premium Seller" className="inline-flex items-center justify-center w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] shadow-sm shrink-0">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      {seller.averageRating && seller.averageRating > 0 ? (
                        <span className="flex items-center gap-0.5 text-yellow-600 dark:text-yellow-500 font-bold">
                          <Star size={14} fill="currentColor" /> {Number(seller.averageRating).toFixed(1)} 
                          <span className="text-muted-foreground/70 font-normal ml-0.5">({seller.reviewCount})</span>
                        </span>
                      ) : (
                        <span className="font-medium text-primary/80">New Vendor</span>
                      )}
                      <span className="opacity-50">•</span>
                      <MapPin size={12} className="opacity-70" />
                      <span className="truncate">{seller.city || "Unknown Location"}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed flex-grow">
                    {seller.description || "No description provided by this vendor."}
                  </p>

                  <div className="mt-auto space-y-2 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock size={14} className="text-primary/70" />
                        <span className="font-medium">{seller.openingHours || "Hours unlisted"}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-md font-semibold text-xs border border-primary/20">
                        <Package size={14} />
                        <span>{seller.productCount || 0} Products</span>
                      </div>
                    </div>
                    
                    {userLocation && seller.distance !== undefined && (
                      <div className="text-xs text-muted-foreground font-medium">
                        {Number(seller.distance).toFixed(1)} km away from you
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
