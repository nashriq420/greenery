"use client";

import { ShieldAlert, ShieldCheck, XCircle } from "lucide-react";

export default function PrivacyWarning() {
  return (
    <div className="bg-white p-4 border-b space-y-3 text-sm">
      <div className="flex items-start gap-3">
        <div className="text-red-600 font-bold shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-red-600">Possible scammers, if...</h3>
          <ul className="space-y-1 mt-1 text-red-500">
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              Asked for advance payment.
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              Overseas money transfers.
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              Contact information on their profiles.
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              Consumers pretending to sell.
            </li>
          </ul>
        </div>
      </div>

      <div className="flex items-start gap-3 border-t pt-3">
        <div className="text-green-600 font-bold shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-green-600">Check for...</h3>
          <ul className="space-y-1 mt-1 text-green-500">
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Reviews on profile
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Legitimate menu items on profile.
            </li>
          </ul>
        </div>
      </div>

      <p className="text-xs text-gray-400 italic text-center border-t pt-2">
        Protect your privacy. Do not share confidential information.
      </p>
    </div>
  );
}
