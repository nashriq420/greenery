import React from "react";

export default function Navbar() {
  return (
    <header className="glass-nav">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <a 
          href="/" 
          className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight hover-lift transition-all"
        >
          <img
            src="/logo.png"
            alt="BudPlug Logo"
            className="h-8 w-8 object-contain rounded-full"
          />
          BudPlug
        </a>
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
  );
}
