import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-background pt-24 md:pt-32 lg:pt-40 pb-20">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/80 text-secondary-foreground text-sm font-medium mb-8 backdrop-blur-sm shadow-sm ring-1 ring-border/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Premium Marketplace & Community
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
            Discover & Source <br className="hidden md:block" />{" "}
            <span className="text-primary">Premium BudPlug.</span>
          </h1>

          <div className="flex justify-center mb-8">
            <img src="/logo.png" alt="BudPlug Logo" className="w-32 h-32 md:w-48 md:h-48 object-contain rounded-full shadow-2xl ring-4 ring-primary/20" />
          </div>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
            Connect with top-tier vendors. Discover natural remedies, compare
            strains, and enjoy a curated, trustworthy shopping experience.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/login?tab=signup"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold transition-all shadow-soft hover-lift active-scale flex items-center justify-center gap-2 group"
            >
              Start Exploring
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard/marketplace"
              className="w-full sm:w-auto px-8 py-4 bg-background border border-border text-foreground rounded-xl font-semibold transition-all hover:bg-secondary/50 shadow-soft hover-lift active-scale"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]"></div>
      </div>
    </section>
  );
}
