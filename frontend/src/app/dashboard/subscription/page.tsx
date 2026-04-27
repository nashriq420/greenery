"use client";

import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrencyStore } from "@/hooks/useCurrency";

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const formatPrice = useCurrencyStore((state) => state.formatPrice);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await api.post(
        "/subscription/upgrade",
        {},
      );
      alert(
        "Subscription upgraded! You can now access Chat and Seller features.",
      );
      router.push("/dashboard");
    } catch (error) {
      alert("Upgrade failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Choose your Plan</h1>
        <p className="text-gray-500 mt-2">
          Unlock the full potential of BudPlug
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Free Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Free Explorer</CardTitle>
            <CardDescription>For casual browsing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              {formatPrice(0)}{" "}
              <span className="text-sm font-normal text-gray-500">/year</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ Browse Map</li>
              <li>✓ View Listings</li>
              <li className="text-gray-400">✗ Chat with Sellers</li>
              <li className="text-gray-400">✗ Post Listings</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Tier */}
        <Card className="border-green-600 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-green-600 text-white text-xs px-3 py-1 rounded-bl">
            RECOMMENDED
          </div>
          <CardHeader>
            <CardTitle>BudPlug Pro</CardTitle>
            <CardDescription>For serious buyers & sellers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              {formatPrice(29)}{" "}
              <span className="text-sm font-normal text-gray-500">/year</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ Browse Map</li>
              <li>✓ View Listings</li>
              <li className="font-medium text-green-700">
                ✓ Chat with Sellers
              </li>
              <li className="font-medium text-green-700">
                ✓ Post Listings (Sellers)
              </li>
              <li>✓ Verified Badge</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? "Processing..." : "Upgrade Now"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
