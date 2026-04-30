"use client";

import { useState } from "react";
import { Heart, Star } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";

interface FavoriteButtonProps {
  sellerId: string;
  initialIsFavorited?: boolean;
  variant?: "heart" | "star";
  className?: string;
  size?: number;
}

export default function FavoriteButton({
  sellerId,
  initialIsFavorited = false,
  variant = "heart",
  className = "",
  size = 16,
}: FavoriteButtonProps) {
  const { user } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to favorite sellers");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/user/favorites/toggle", { sellerId });
      setIsFavorited(res.favorited);
      if (res.favorited) {
        toast.success("Added to favorites");
      } else {
        toast.success("Removed from favorites");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorites");
    } finally {
      setLoading(false);
    }
  };

  const Icon = variant === "heart" ? Heart : Star;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`transition-all duration-300 ${className} ${
        isFavorited
          ? variant === "heart"
            ? "text-rose-500 fill-rose-500"
            : "text-amber-500 fill-amber-500"
          : "text-muted-foreground hover:text-foreground"
      }`}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Icon size={size} className={isFavorited ? "fill-current" : ""} />
    </button>
  );
}
