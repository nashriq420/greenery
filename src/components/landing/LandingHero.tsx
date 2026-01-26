import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";

export default function LandingHero() {
    return (
        <section className="relative overflow-hidden bg-background pt-16 md:pt-24 lg:pt-32 pb-16">
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Live Marketplace & Community
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
                        Buy, Sell, and <span className="text-primary">Green</span> <br className="hidden md:block" /> Your Space.
                    </h1>

                    <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
                        Connect with local plant enthusiasts. Discover rare finds, share your own layout, and grow your urban jungle today.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/login?tab=signup"
                            className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-semibold transition-all shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 group"
                        >
                            Get Started
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/dashboard/marketplace"
                            className="w-full sm:w-auto px-8 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full font-semibold transition-all"
                        >
                            Browse Marketplace
                        </Link>
                    </div>
                </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 dark:opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/30 blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-3xl"></div>
            </div>
        </section>
    );
}
