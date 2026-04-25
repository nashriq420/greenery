"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <header className="glass-nav">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight hover-lift transition-all"
        >
          <img
            src="/logo.png"
            alt="BudPlug Logo"
            className="h-8 w-8 object-contain rounded-full"
          />
          BudPlug
        </Link>
        <div className="flex gap-6 items-center">
          {mounted && isAuthenticated ? (
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition shadow-soft hover-lift active-scale"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium hover:text-primary text-muted-foreground transition-colors hover-lift"
              >
                Login
              </Link>
              <Link
                href="/login?tab=signup"
                className="px-6 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition shadow-soft hover-lift active-scale"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
