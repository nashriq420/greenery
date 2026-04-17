import React from "react";

export default function Footer() {
  return (
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
  );
}
