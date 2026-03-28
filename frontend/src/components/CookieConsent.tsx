"use client";

import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import Link from "next/link";

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "true");
    setShowConsent(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie_consent", "declined");
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pb-safe animate-in slide-in-from-bottom-full duration-500">
      <div className="max-w-4xl mx-auto bg-card border border-border shadow-2xl rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="flex items-start gap-4 flex-1 relative z-10 text-left">
          <div className="bg-primary/10 p-3 rounded-full hidden sm:flex shrink-0">
            <Cookie className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cookie className="h-4 w-4 text-primary sm:hidden" />
              <h3 className="font-semibold text-card-foreground text-lg sm:text-base">
                Cookies & Privacy
              </h3>
            </div>
            <p className="text-sm text-card-foreground/80 leading-relaxed">
              We use cookies to enhance your browsing experience. Additionally,
              we access and use your device location to provide our interactive
              map features, showing you and nearby sellers. By continuing to use
              our site, you agree to our{" "}
              <Link
                href="/privacy"
                className="text-primary hover:underline font-medium"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto relative z-10 pt-2 sm:pt-0">
          <button
            onClick={declineCookies}
            className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-foreground bg-secondary/50 hover:bg-secondary/80 rounded-lg transition-colors border border-border shadow-sm"
          >
            Decline
          </button>
          <button
            onClick={acceptCookies}
            className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
