"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { TrendingUp, Tag, Flame } from "lucide-react";

interface TagStat {
  tag: string;
  label: string;
  recentCount: number;
  totalCount: number;
}

interface TrendingData {
  trending: TagStat[];
  allTags: TagStat[];
}

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> =
  {
    general: {
      bg: "bg-slate-100 dark:bg-slate-800",
      text: "text-slate-700 dark:text-slate-300",
      border: "border-slate-300 dark:border-slate-600",
    },
    marketplace: {
      bg: "bg-blue-100 dark:bg-blue-900/40",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-300 dark:border-blue-600",
    },
    listing: {
      bg: "bg-purple-100 dark:bg-purple-900/40",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-300 dark:border-purple-600",
    },
    vendor: {
      bg: "bg-orange-100 dark:bg-orange-900/40",
      text: "text-orange-700 dark:text-orange-300",
      border: "border-orange-300 dark:border-orange-600",
    },
    "growing-tips": {
      bg: "bg-green-100 dark:bg-green-900/40",
      text: "text-green-700 dark:text-green-300",
      border: "border-green-300 dark:border-green-600",
    },
    questions: {
      bg: "bg-yellow-100 dark:bg-yellow-900/40",
      text: "text-yellow-700 dark:text-yellow-300",
      border: "border-yellow-300 dark:border-yellow-600",
    },
  };

const TAG_DESCRIPTIONS: Record<string, string> = {
  general: "General community discussion",
  marketplace: "Discuss or complain about listings",
  listing: "Highlight specific products",
  vendor: "Vendor announcements and reviews",
  "growing-tips": "Share cultivation advice",
  questions: "Ask the community for help",
};

interface CommunitySidebarProps {
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  postCount?: number;
}

export default function CommunitySidebar({
  selectedTag,
  onTagSelect,
  postCount = 0,
}: CommunitySidebarProps) {
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const result = await api.get("/community/trending");
        setData(result);
      } catch (error) {
        console.error("Failed to fetch trending topics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const allTags = data?.allTags ?? [
    { tag: "general", label: "💬 General", recentCount: 0, totalCount: 0 },
    {
      tag: "marketplace",
      label: "🛒 Marketplace",
      recentCount: 0,
      totalCount: 0,
    },
    { tag: "listing", label: "📋 Listing", recentCount: 0, totalCount: 0 },
    { tag: "vendor", label: "🏪 Vendor", recentCount: 0, totalCount: 0 },
    {
      tag: "growing-tips",
      label: "🌱 Growing Tips",
      recentCount: 0,
      totalCount: 0,
    },
    { tag: "questions", label: "❓ Questions", recentCount: 0, totalCount: 0 },
  ];

  const trending = data?.trending ?? [];

  return (
    <div className="space-y-4">
      {/* Community Stats */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-lg">
          </div>
          <div>
            <h2 className="font-bold text-sm text-foreground">r/BudPlug</h2>
            <p className="text-xs text-muted-foreground">
              The cannabis community
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{postCount}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">🟢</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={18} className="text-orange-500" />
          <h3 className="font-bold text-base text-foreground">Hot Topics</h3>
          <span className="text-xs text-muted-foreground ml-auto">7 days</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : trending.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            No trending topics yet. Be the first to post!
          </p>
        ) : (
          <div className="space-y-1">
            {trending.map((item, idx) => {
              const colors = TAG_COLORS[item.tag] || TAG_COLORS["general"];
              return (
                <button
                  key={item.tag}
                  onClick={() =>
                    onTagSelect(selectedTag === item.tag ? null : item.tag)
                  }
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-sm border ${
                    selectedTag === item.tag
                      ? `${colors.bg} ${colors.text} ${colors.border} font-semibold`
                      : "hover:bg-muted border-transparent text-foreground"
                  }`}
                >
                  <span className="text-xs font-bold text-muted-foreground w-4">
                    #{idx + 1}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${colors.bg} ${colors.text}`}
                  >
                    {item.recentCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tag Guides */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Tag size={18} className="text-primary" />
          <h3 className="font-bold text-base text-foreground">Tag Guides</h3>
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => onTagSelect(null)}
            className={`w-full flex items-start justify-between px-3 py-2 rounded-lg text-sm transition-all border ${
              !selectedTag
                ? "bg-primary text-primary-foreground border-primary font-semibold"
                : "border-transparent hover:bg-muted text-foreground"
            }`}
          >
            <div className="flex flex-col text-left">
              <span>📰 All Posts</span>
              <span
                className={`text-xs font-normal mt-0.5 leading-tight ${!selectedTag ? "text-primary-foreground/80" : "text-muted-foreground"}`}
              >
                View everything
              </span>
            </div>
          </button>
          {allTags.map((item) => {
            const colors = TAG_COLORS[item.tag] || TAG_COLORS["general"];
            const desc = TAG_DESCRIPTIONS[item.tag] || "";
            return (
              <button
                key={item.tag}
                onClick={() =>
                  onTagSelect(selectedTag === item.tag ? null : item.tag)
                }
                className={`w-full flex items-start justify-between px-3 py-2 text-left rounded-lg text-sm transition-all border ${
                  selectedTag === item.tag
                    ? `${colors.bg} ${colors.border} font-semibold`
                    : "border-transparent hover:bg-muted"
                }`}
              >
                <div className="flex flex-col">
                  <span
                    className={`${selectedTag === item.tag ? colors.text : "text-foreground"}`}
                  >
                    {item.label}
                  </span>
                  {desc && (
                    <span className="text-xs text-muted-foreground font-normal mt-0.5 leading-tight">
                      {desc}
                    </span>
                  )}
                </div>
                {item.totalCount > 0 && (
                  <span className="text-xs text-muted-foreground mt-0.5 shrink-0 ml-2">
                    {item.totalCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Community Rules */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <h3 className="font-bold text-base text-foreground mb-3">
          📜 Community Rules
        </h3>
        <ol className="space-y-2.5 text-sm text-muted-foreground">
          <li className="flex gap-2 items-start">
            <span className="text-primary font-bold shrink-0">1.</span>Be
            respectful to all members
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-primary font-bold shrink-0">2.</span>Tag your
            posts correctly
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-primary font-bold shrink-0">3.</span>No spam
            or self-promotion in General
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-primary font-bold shrink-0">4.</span>Stay on
            topic for each tag
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-primary font-bold shrink-0">5.</span>Follow
            all local laws and regulations
          </li>
        </ol>
      </div>
    </div>
  );
}
