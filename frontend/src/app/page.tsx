import Navbar from "@/components/Navbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingMarketplace from "@/components/landing/LandingMarketplace";
import LandingMap from "@/components/landing/LandingMap";

import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <LandingHero />
      <LandingMarketplace />
      <LandingMap />

      <Footer />
    </main>
  );
}
