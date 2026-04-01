import LandingHero from "@/components/landing/LandingHero";
import LandingMarketplace from "@/components/landing/LandingMarketplace";
import LandingMap from "@/components/landing/LandingMap";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Use the new glass-nav utility from globals.css for the header */}
      <header className="glass-nav">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight">
            BudPlug
          </div>
          <div className="flex gap-6 items-center">
            <a
              href="/login"
              className="text-sm font-medium hover:text-primary text-muted-foreground transition-colors hover-lift"
            >
              Login
            </a>
            <a
              href="/login?tab=signup"
              className="px-6 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition shadow-soft hover-lift active-scale"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      <LandingHero />
      <LandingMarketplace />
      <LandingMap />

      {/* Premium Dark Footer (Aligned with new Dark Mode colors) */}
      <footer className="py-12 bg-[#121614] border-t border-[#2A322E] text-slate-300 text-center">
        <div className="flex justify-center gap-8 mb-6 text-sm font-medium">
          <a href="/terms" className="hover:text-primary transition-colors">
            Terms & Conditions
          </a>
          <a href="/privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </a>
        </div>
        <p className="text-[#94A3B8] text-sm tracking-wide">
          © 2026 BudPlug. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
