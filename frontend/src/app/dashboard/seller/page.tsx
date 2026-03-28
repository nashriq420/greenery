"use client";

import { useEffect, useState } from "react";
import { useSellers } from "@/hooks/useMarketplace";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SellersPage() {
  const [location, setLocation] = useState<{ lat: number; lng: number }>({
    lat: 51.505,
    lng: -0.09,
  }); // Default to London
  const { sellers, loading } = useSellers(location.lat, location.lng);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Nearby Sellers</h1>

      {loading ? (
        <div className="text-center py-10">Loading sellers...</div>
      ) : sellers.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No sellers found nearby.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellers.map((seller) => (
            <Card key={seller.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{seller.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  {seller.city || "Location unknown"}
                </p>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {seller.description || "No description available"}
                </p>
                <Link href={`/dashboard/seller/${seller.userId}`}>
                  <Button className="w-full">View Profile</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
