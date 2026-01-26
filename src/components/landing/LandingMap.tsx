'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const LandingMapContent = dynamic(() => import('./LandingMapContent'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 dark:bg-zinc-800 animate-pulse flex items-center justify-center text-gray-400">Loading Map...</div>
});

export default function LandingMap() {
    return (
        <section className="py-20 bg-background border-t border-border">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
                            <MapPin className="w-4 h-4" />
                            Local & Live
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                            Find Greenery in Your Neighborhood
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                            Stop shipping plants across the country. Connect with sellers right around the corner to reduce carbon footprint and build community.
                        </p>

                        <ul className="space-y-4 mb-8">
                            {[
                                "View sellers on an interactive map",
                                "Filter by distance and plant type",
                                "Chat directly with local growers"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-foreground">
                                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <button className="px-8 py-3 bg-background border-2 border-border hover:border-primary text-foreground rounded-lg font-semibold transition-colors">
                            Explore the Map
                        </button>
                    </div>

                    <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-background relative z-0">
                        <LandingMapContent />
                    </div>
                </div>
            </div>
        </section>
    );
}
