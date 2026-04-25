"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useCurrencyStore } from "@/hooks/useCurrency";

// Dummy Data mapped to Premium Cannabis feel (placeholder images)
const DUMMY_LISTINGS = [
  {
    id: 1,
    title: "Northern Lights Premium Flower",
    price: "$120",
    image:
      "https://images.unsplash.com/photo-1629831419736-2248554dc9b8?auto=format&fit=crop&q=80&w=600",
    seller: "Green Compass",
    location: "Premium Verified",
  },
  {
    id: 2,
    title: "Blue Dream Concentrates",
    price: "$85",
    image:
      "https://images.unsplash.com/photo-1558000143-a60d62cff829?auto=format&fit=crop&q=80&w=600",
    seller: "Elevate Botanicals",
    location: "Lab Tested",
  },
  {
    id: 3,
    title: "CBD Wellness Tincture",
    price: "$35",
    image:
      "https://images.unsplash.com/photo-1611078813892-abce3db69fbc?auto=format&fit=crop&q=80&w=600",
    seller: "Nature's Path",
    location: "Organic",
  },
  {
    id: 4,
    title: "Sour Diesel Pre-Rolls",
    price: "$25",
    image:
      "https://images.unsplash.com/photo-1589139265275-5c1a742886f6?auto=format&fit=crop&q=80&w=600",
    seller: "High Valley",
    location: "Top Shelf",
  },
];

export default function LandingMarketplace() {
  const formatPrice = useCurrencyStore((state) => state.formatPrice);
  const isLoaded = useCurrencyStore((state) => state.isLoaded);

  return (
    <section className="py-24 bg-secondary">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
              Curated Selection
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              Explore top-tier, lab-tested products from verified premium
              vendors.
            </p>
          </div>
          <Link
            href="/dashboard/marketplace"
            className="text-primary font-medium hover:text-primary/80 transition-colors flex items-center gap-1 group"
          >
            View all listings
            <span className="group-hover:translate-x-1 transition-transform">
              &rarr;
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {DUMMY_LISTINGS.map((listing) => (
            <div
              key={listing.id}
              className="group bg-card rounded-2xl overflow-hidden border border-border shadow-soft hover-lift cursor-pointer flex flex-col"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={listing.image}
                  alt={listing.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <button className="absolute top-4 right-4 p-2.5 bg-background/80 backdrop-blur-md rounded-full text-muted-foreground hover:bg-background hover:text-destructive transition-colors shadow-sm active-scale">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h3 className="font-semibold text-foreground line-clamp-1 leading-tight">
                    {listing.title}
                  </h3>
                  <span className="font-semibold text-foreground">
                    {isLoaded ? formatPrice(listing.price) : listing.price}
                  </span>
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between text-caption border-t border-border/50">
                  <span className="flex items-center gap-1.5 font-medium text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/80"></span>
                    {listing.seller}
                  </span>
                  <span className="text-muted-foreground">
                    {listing.location}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
