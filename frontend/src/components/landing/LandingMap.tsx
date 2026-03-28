"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const LandingMapContent = dynamic(() => import("./LandingMapContent"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-muted/50 dark:bg-muted/10 animate-pulse flex items-center justify-center text-muted-foreground">
      Loading interactive map...
    </div>
  ),
});

export default function LandingMap() {
  return (
    <section className="py-24 bg-background border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8 ring-1 ring-border/50">
              <MapPin className="w-4 h-4" />
              Local & Verified
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
              Source Premium Products Locally
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              Connect with verified sellers in your neighborhood. Discover
              top-tier strains, concentrates, and wellness products with
              confidence.
            </p>

            <ul className="space-y-5 mb-10">
              {[
                "Explore verified vendors on an interactive map",
                "Filter by product categories and distance",
                "Chat securely with local providers",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 text-foreground font-medium"
                >
                  <div className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/20"></div>
                  {item}
                </li>
              ))}
            </ul>

            <button className="px-8 py-4 bg-background border border-border text-foreground rounded-xl font-semibold transition-all hover:bg-secondary/50 shadow-soft hover-lift active-scale">
              Explore the Map
            </button>
          </div>

          <div className="h-[550px] w-full rounded-2xl overflow-hidden shadow-soft border border-border/50 relative z-0">
            <LandingMapContent />
          </div>
        </div>
      </div>
    </section>
  );
}
