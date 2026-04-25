import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="grow py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-primary tracking-tight">
              About BudPlug
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're building the future of the cannabis marketplace, connecting
              enthusiasts with the best vendors in a safe, secure, and community-driven
              environment.
            </p>
          </div>

          <div className="space-y-12 text-foreground/80">
            <section className="bg-card p-8 rounded-2xl border border-border shadow-sm">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">
                Our Mission
              </h2>
              <div className="space-y-4 leading-relaxed">
                <p>
                  At BudPlug, our mission is to provide a transparent, reliable, and
                  enjoyable platform for cannabis consumers and vendors to connect. We
                  believe in fostering a community built on trust, quality, and mutual
                  respect.
                </p>
                <p>
                  We strive to elevate the cannabis experience by offering a streamlined
                  marketplace that prioritizes safety and compliance while celebrating the
                  culture and benefits of the plant.
                </p>
              </div>
            </section>

            <section className="bg-card p-8 rounded-2xl border border-border shadow-sm">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">
                What We Offer
              </h2>
              <div className="grid md:grid-cols-2 gap-8 mt-6">
                <div>
                  <h3 className="text-xl font-medium mb-2 text-primary">For Consumers</h3>
                  <p className="leading-relaxed">
                    Discover top-rated vendors, explore a wide variety of products, and
                    engage with a vibrant community. Enjoy a secure platform with verified
                    reviews and real-time interactions.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2 text-primary">For Vendors</h3>
                  <p className="leading-relaxed">
                    Reach a targeted audience, manage your listings with ease, and build
                    your brand reputation. Benefit from our premium visibility features
                    and direct customer engagement tools.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-card p-8 rounded-2xl border border-border shadow-sm">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">
                Our Values
              </h2>
              <ul className="grid md:grid-cols-3 gap-6">
                <li className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 text-xl font-bold">
                    1
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Trust & Safety</h3>
                  <p className="text-sm">Prioritizing secure transactions and a safe environment for all users.</p>
                </li>
                <li className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 text-xl font-bold">
                    2
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Community First</h3>
                  <p className="text-sm">Building a platform that listens to and evolves with its members.</p>
                </li>
                <li className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 text-xl font-bold">
                    3
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Innovation</h3>
                  <p className="text-sm">Continuously improving our features to deliver the best possible experience.</p>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
