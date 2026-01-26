import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

// Dummy Data
const DUMMY_LISTINGS = [
    {
        id: 1,
        title: "Monstera Variegata",
        price: "$120",
        image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=600",
        seller: "Sarah's Jungle",
        location: "Brooklyn, NY"
    },
    {
        id: 2,
        title: "Fiddle Leaf Fig",
        price: "$85",
        image: "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=600",
        seller: "Green Thumb",
        location: "Queens, NY"
    },
    {
        id: 3,
        title: "Snake Plant (Sansevieria)",
        price: "$35",
        image: "https://images.unsplash.com/photo-1599598425947-63300f081395?auto=format&fit=crop&q=80&w=600",
        seller: "Urban Bots",
        location: "Manhattan, NY"
    },
    {
        id: 4,
        title: "Pothos Neon",
        price: "$25",
        image: "https://images.unsplash.com/photo-1593482596950-e88939c32df0?auto=format&fit=crop&q=80&w=600",
        seller: "Leafy Life",
        location: "Jersey City, NJ"
    }
];

export default function LandingMarketplace() {
    return (
        <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                            Fresh from the Community
                        </h2>
                        <p className="text-muted-foreground">
                            Explore lively plants grown by locals near you.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/marketplace"
                        className="text-primary font-semibold hover:text-primary/80 hover:underline decoration-2 underline-offset-4"
                    >
                        View all listings &rarr;
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {DUMMY_LISTINGS.map((listing) => (
                        <div key={listing.id} className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="relative aspect-square overflow-hidden bg-muted">
                                {/* Using unoptimized images related to plants for the dummy data */}
                                <Image
                                    src={listing.image}
                                    alt={listing.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <button className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full text-foreground/70 hover:bg-background hover:text-destructive transition-colors">
                                    <Heart className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-foreground truncate pr-2">
                                        {listing.title}
                                    </h3>
                                    <span className="font-bold text-primary">
                                        {listing.price}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-muted-foreground mt-3">
                                    <span className="flex items-center gap-1">
                                        <span className="w-4 h-4 rounded-full bg-primary"></span>
                                        {listing.seller}
                                    </span>
                                    <span>{listing.location}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
