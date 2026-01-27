import LandingHero from "@/components/landing/LandingHero";
import LandingMarketplace from "@/components/landing/LandingMarketplace";
import LandingMap from "@/components/landing/LandingMap";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <span>🌿</span> Greenery
          </div>
          <div className="flex gap-4 items-center">
            <a href="/login" className="text-sm font-medium hover:text-primary text-muted-foreground transition-colors">Login</a>
            <a href="/login?tab=signup" className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:bg-primary/90 transition shadow-sm hover:shadow-md">Get Started</a>
          </div>
        </div>
      </header>

      <LandingHero />
      <LandingMarketplace />
      <LandingMap />

      <footer className="py-12 bg-gray-900 text-white text-center">
        <div className="flex justify-center gap-6 mb-4">
          <a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms & Conditions</a>
          <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
        </div>
        <p className="text-gray-500">© 2026 Greenery. All rights reserved.</p>
      </footer>
    </main>
  );
}
