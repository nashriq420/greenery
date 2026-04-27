"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import PostCard from "@/components/community/PostCard";
import CommunitySidebar from "@/components/community/CommunitySidebar";
import { Image as ImageIcon, Send, ChevronDown, Menu, X } from "lucide-react";

interface Post {
  id: string;
  content: string;
  imageUrl?: string | null;
  isEdited: boolean;
  createdAt: string;
  tag?: string | null;
  author: {
    id: string;
    name: string;
    role: string;
    profilePicture?: string | null;
    subscription?: {
      status: string;
    } | null;
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  status: string;
}

const POST_TAGS = [
  {
    tag: "general",
    label: "💬 General",
    color:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
  },
  {
    tag: "marketplace",
    label: "🛒 Marketplace",
    color:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-600",
  },
  {
    tag: "listing",
    label: "📋 Listing",
    color:
      "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-600",
  },
  {
    tag: "vendor",
    label: "🏪 Vendor",
    color:
      "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-600",
  },
  {
    tag: "growing-tips",
    label: "🌱 Growing Tips",
    color:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-600",
  },
  {
    tag: "questions",
    label: "❓ Questions",
    color:
      "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-600",
  },
];

const SORT_OPTIONS = [
  { value: "new", label: "🆕 New" },
  { value: "top", label: "🏆 Top" },
  { value: "hot", label: "🔥 Hot" },
];

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("new");
  const [showSidebar, setShowSidebar] = useState(false);

  // Create Post State
  const [newContent, setNewContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedPostTag, setSelectedPostTag] = useState("general");

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedTag
        ? `/community/feed?tag=${selectedTag}`
        : "/community/feed";
      const data = await api.get(url);
      if (Array.isArray(data)) {
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch feed", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectedTag]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    setShowSidebar(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() && !selectedFile) return;
    if (!isAuthenticated) return;

    setIsPosting(true);
    try {
      let uploadedImageUrl = "";

      if (selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);

        const uploadData = await api.upload("/upload/image", formData);
        uploadedImageUrl = uploadData.url;
      }

      await api.post(
        "/community/posts",
        {
          content: newContent,
          imageUrl: uploadedImageUrl || undefined,
          tag: selectedPostTag,
        });

      setNewContent("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowImageInput(false);
      setSelectedPostTag("general");
      fetchFeed();
    } catch (error) {
      console.error(error);
      alert("Failed to post");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const selectedTagInfo = POST_TAGS.find((t) => t.tag === selectedTag);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Mobile Sidebar — full-screen overlay drawer */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 z-10000 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
          />
          {/* Drawer panel */}
          <div className="relative z-10 w-[85vw] max-w-sm bg-background h-full overflow-y-auto p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-foreground">
                Topics &amp; Tags
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <CommunitySidebar
              selectedTag={selectedTag}
              onTagSelect={handleTagSelect}
              postCount={posts.length}
            />
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Left Sidebar - Desktop */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
            <CommunitySidebar
              selectedTag={selectedTag}
              onTagSelect={handleTagSelect}
              postCount={posts.length}
            />
          </div>
        </aside>

        {/* Main Feed */}
        <main className="flex-1 min-w-0 space-y-3">
          {/* Mobile sticky toolbar */}
          <div className="lg:hidden sticky top-16 z-30 flex items-center gap-2 bg-background/95 backdrop-blur-sm py-2">
            <button
              onClick={() => setShowSidebar(true)}
              className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl text-sm font-medium text-foreground shadow-sm active:scale-95 transition"
            >
              <Menu size={16} />
              Topics
            </button>
            {selectedTag && selectedTagInfo ? (
              <span
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border font-semibold ${selectedTagInfo.color}`}
              >
                {selectedTagInfo.label}
                <button
                  onClick={() => setSelectedTag(null)}
                  className="ml-1 opacity-70 hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">All Posts</span>
            )}
          </div>

          {/* Active Filter Banner — desktop only */}
          {selectedTag && selectedTagInfo && (
            <div
              className={`hidden lg:flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium ${selectedTagInfo.color}`}
            >
              <span>Showing posts tagged: {selectedTagInfo.label}</span>
              <button
                onClick={() => setSelectedTag(null)}
                className="hover:opacity-70 transition text-xs underline"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Create Post Widget */}
          {user ? (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all focus-within:ring-1 focus-within:ring-primary/30 focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <form onSubmit={handleCreatePost}>
                <div className="p-4 sm:p-5 flex gap-4">
                  {/* Avatar */}
                  <div className="hidden sm:flex w-10 h-10 bg-primary/10 rounded-full items-center justify-center text-primary font-bold shrink-0 overflow-hidden border border-primary/20">
                    {user.profilePicture && !imageError ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col pt-1">
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="What's growing on?"
                      className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/70 resize-none outline-none text-base min-h-[60px]"
                    />

                    {/* Image Preview Container */}
                    {previewUrl && (
                      <div className="relative w-full max-w-sm h-48 mt-3 bg-muted rounded-xl overflow-hidden border border-border shadow-sm group">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                          className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 shadow-sm"
                          title="Remove image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-muted/30 px-4 sm:px-5 py-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                    {/* Tag Selector Dropdown (simpler UI) */}
                    <div className="relative">
                      <select
                        value={selectedPostTag}
                        onChange={(e) => setSelectedPostTag(e.target.value)}
                        className="appearance-none bg-background border border-border text-foreground text-xs font-semibold py-1.5 pl-3 pr-8 rounded-full focus:outline-none focus:ring-1 focus:ring-primary shadow-sm hover:bg-muted/50 transition-colors"
                      >
                        {POST_TAGS.map((t) => (
                          <option key={t.tag} value={t.tag}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                    </div>

                    {/* File Input trigger */}
                    <div className="relative overflow-hidden inline-[block]">
                      <button
                        type="button"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-full transition-colors"
                        onClick={() => {
                          const input =
                            document.getElementById("post-image-upload");
                          if (input) input.click();
                        }}
                      >
                        <ImageIcon size={14} />
                        {selectedFile ? "Change Photo" : "Add Photo"}
                      </button>
                      <input
                        id="post-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer hidden"
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="submit"
                    disabled={
                      isPosting || (!newContent.trim() && !selectedFile)
                    }
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm sm:w-auto w-full shrink-0"
                  >
                    <Send size={14} />
                    {isPosting ? "Posting..." : "Post"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground text-sm shadow-sm flex flex-col items-center justify-center gap-3">
              <span className="text-3xl">👋</span>
              <p>
                Join the conversation!{" "}
                <a
                  href="/login"
                  className="text-primary hover:underline font-bold"
                >
                  Log in
                </a>{" "}
                to post and interact.
              </p>
            </div>
          )}

          {/* Sort Bar */}
          <div className="bg-card border border-border rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  sortBy === opt.value
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Feed */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-border h-48 rounded-xl shadow-sm animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
                  <p className="text-4xl mb-3">🌱</p>
                  <p className="font-semibold text-foreground mb-1">
                    {selectedTag
                      ? `No posts tagged "${selectedTagInfo?.label}"`
                      : "No posts yet"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTag
                      ? "Try a different tag or be the first to post!"
                      : "Be the first to share!"}
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLikeToggle={() => {}}
                    onDelete={handleDeletePost}
                  />
                ))
              )}
            </div>
          )}
        </main>

        {/* Right Panel - Desktop only */}
        <aside className="hidden xl:block w-64 shrink-0">
          <div className="sticky top-24 space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-sm text-foreground mb-3">
                🔗 Quick Links
              </h3>
              <div className="space-y-3">
                <a
                  href="#"
                  className="block text-sm text-muted-foreground hover:text-primary transition"
                >
                  Community Guidelines
                </a>
                <a
                  href="#"
                  className="block text-sm text-muted-foreground hover:text-primary transition"
                >
                  Frequently Asked Questions
                </a>
                <a
                  href="#"
                  className="block text-sm text-muted-foreground hover:text-primary transition"
                >
                  Contact Support
                </a>
              </div>
            </div>
            <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-sm text-green-800 dark:text-green-300 mb-2">
                BudPlug Community
              </h3>
              <p className="text-xs text-green-700 dark:text-green-400">
                A safe space for cannabis enthusiasts. Connect, share, and grow
                together.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
