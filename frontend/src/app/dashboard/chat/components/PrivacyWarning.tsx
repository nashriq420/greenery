"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck, XCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function PrivacyWarning() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden mb-2">
      {/* Collapsed summary / toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-foreground">
            Safety Tips for Buyers
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 rounded-full">
            Important
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border">
          {/* Scam indicators */}
          <div className="pt-3">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                Watch out for possible scammers
              </h3>
            </div>
            <ul className="space-y-1.5">
              {[
                "Asked for advance payment",
                "Overseas money transfers",
                "Contact info shared on profiles",
                "Consumers pretending to sell",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Trust signals */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
              <h3 className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                Verify before you buy
              </h3>
            </div>
            <ul className="space-y-1.5">
              {[
                "Check reviews on seller's profile",
                "Look for legitimate menu items on profile",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[10px] text-muted-foreground/70 italic text-center border-t border-border pt-2">
            Protect your privacy. Do not share confidential information.
          </p>
        </div>
      )}
    </div>
  );
}
