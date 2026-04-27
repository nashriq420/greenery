"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  BadgeCheck,
  Flag,
  AlertTriangle,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

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

interface PostCardProps {
  post: Post;
  onLikeToggle: () => void;
  onDelete?: (id: string) => void;
}

export default function PostCard({
  post,
  onLikeToggle,
  onDelete,
}: PostCardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [currentContent, setCurrentContent] = useState(post.content);
  const [showMenu, setShowMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Comment State
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentsCountState, setCommentsCountState] = useState(
    post.commentsCount,
  );

  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const isAuthor = user?.id === post.author.id;

  const handleLike = async () => {
    if (!isAuthenticated) return;

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount((prev) => (newLikedState ? prev + 1 : prev - 1));

    if (newLikedState) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    }

    try {
      await api.post(`/community/posts/${post.id}/like`, {});
      onLikeToggle();
    } catch (error) {
      setIsLiked(!newLikedState);
      setLikesCount((prev) => (!newLikedState ? prev + 1 : prev - 1));
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    try {
      await api.put(
        `/community/posts/${post.id}`,
        {
          content: editContent,
          imageUrl: post.imageUrl,
        });

      setCurrentContent(editContent);
      setIsEditing(false);
      setShowMenu(false);
    } catch (error) {
      alert("Failed to update post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/community/posts/${post.id}`);
      if (onDelete) onDelete(post.id);
    } catch (error) {
      alert("Failed to delete post");
    }
  };

  const toggleComments = async () => {
    if (!showComments) {
      setCommentsLoading(true);
      try {
        const data = await api.get(`/community/posts/${post.id}/comments`);
        setComments(data);
      } catch (error) {
        console.error("Failed to fetch comments", error);
      } finally {
        setCommentsLoading(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    try {
      const comment = await api.post(
        `/community/posts/${post.id}/comments`,
        {
          content: newComment,
        });

      setComments((prev) => [...prev, comment]);
      setNewComment("");
      setCommentsCountState((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to add comment", error);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    setIsReporting(true);
    try {
      await api.post(
        `/community/posts/${post.id}/report`,
        {
          reason: reportReason,
          details: reportDetails,
        });
      alert("Post reported successfully");
      setShowReportModal(false);
      setReportDetails("");
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to report post");
    } finally {
      setIsReporting(false);
    }
  };

  if (post.status === "SUSPENDED") {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 border rounded-xl overflow-hidden shadow-sm relative p-4 flex gap-4 items-center">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h3 className="text-red-700 dark:text-red-400 font-semibold text-sm">
            Post Suspended
          </h3>
          <p className="text-red-600/80 dark:text-red-400/80 text-xs mt-0.5">
            This post has been removed for violating community guidelines.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border text-card-foreground rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 relative group">
      {/* Header */}
      <div className="p-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border border-primary/20 shrink-0 relative">
            {post.author.profilePicture && !imageError ? (
              <Image
                src={post.author.profilePicture}
                alt={post.author.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-primary font-bold text-lg">
                {post.author.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-tight">
              <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors cursor-pointer">
                {post.author.name}
              </h3>
              {post.author.role === "SELLER" &&
                post.author.subscription?.status === "ACTIVE" && (
                  <BadgeCheck className="w-4 h-4 text-primary" />
                )}
            </div>
            <div className="text-xs text-muted-foreground flex items-center flex-wrap gap-1.5 mt-0.5 font-medium">
              <span>
                {new Date(post.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {(post.isEdited || currentContent !== post.content) && (
                <span className="text-[10px] italic opacity-70">(edited)</span>
              )}
              {post.author.role === "SELLER" && (
                <>
                  <span className="opacity-50">•</span>
                  {post.author.subscription?.status === "ACTIVE" ? (
                    <span className="px-1.5 py-0.5 bg-yellow-400/10 text-yellow-600 dark:text-yellow-500 text-[9px] rounded-md font-bold uppercase tracking-wider border border-yellow-400/20">
                      Premium
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] rounded-md font-bold uppercase tracking-wider border border-primary/20">
                      Seller
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side: tag badge + menu */}
        <div className="flex items-center gap-3">
          {post.tag && post.tag !== "general" && (
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                post.tag === "marketplace"
                  ? "bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50"
                  : post.tag === "listing"
                    ? "bg-purple-100/50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50"
                    : post.tag === "vendor"
                      ? "bg-orange-100/50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50"
                      : post.tag === "growing-tips"
                        ? "bg-green-100/50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50"
                        : post.tag === "questions"
                          ? "bg-yellow-100/50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50"
                          : "bg-slate-100/50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700"
              }`}
            >
              {post.tag === "marketplace"
                ? "Marketplace"
                : post.tag === "listing"
                  ? "Listing"
                  : post.tag === "vendor"
                    ? "Vendor"
                    : post.tag === "growing-tips"
                      ? "Growing Tips"
                      : post.tag === "questions"
                        ? "Questions"
                        : post.tag.replace("-", " ")}
            </span>
          )}

          {isAuthor && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <MoreHorizontal size={18} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-1.5 w-36 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Edit Post
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-950/50 transition-colors"
                  >
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`px-5 pb-3 ${post.imageUrl ? "mb-2" : ""}`}>
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full border border-border bg-muted/50 text-foreground rounded-xl p-3 text-base focus:ring-1 focus:ring-primary outline-none resize-none shadow-inner"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground px-4 py-1.5 rounded-full hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-1.5 rounded-full flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-foreground text-[15px] leading-relaxed whitespace-pre-wrap">
            {currentContent}
          </p>
        )}
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="px-5 pb-5">
          <div className="w-full bg-muted rounded-xl overflow-hidden border border-border/50 max-h-[500px] flex items-center justify-center relative">
            <img
              src={post.imageUrl}
              alt="Post content"
              className="w-full max-h-[500px] object-cover"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center gap-2">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
            isLiked
              ? "text-red-500 bg-red-500/10"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Heart
            size={18}
            className={`${isLiked ? "fill-current" : ""} ${isAnimating ? "animate-bounce" : ""}`}
          />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={toggleComments}
          className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
            showComments
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <MessageCircle size={18} />
          <span>{commentsCountState}</span>
        </button>

        <div className="flex items-center gap-1 ml-auto">
          {!isAuthor && user && (
            <button
              onClick={() => setShowReportModal(true)}
              className="text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 transition-colors p-2 rounded-full"
              title="Report post"
            >
              <Flag size={16} />
            </button>
          )}
          <button className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors p-2 rounded-full">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-5 pb-5 bg-muted/20 border-t border-border animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-4 pt-5 border-l-2 border-border/50 ml-6 pl-4">
            {commentsLoading ? (
              <div className="text-sm font-medium text-muted-foreground animate-pulse flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                Loading comments...
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-3 relative">
                  {/* Connector line dot */}
                  <div className="absolute top-4 -left-[23px] w-2.5 h-2.5 bg-muted border-2 border-border rounded-full z-10"></div>

                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-primary/20 relative mt-0.5">
                    {comment.author.profilePicture ? (
                      <Image
                        src={comment.author.profilePicture}
                        alt={comment.author.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-primary font-bold text-xs">
                        {comment.author.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-card text-card-foreground p-3 rounded-2xl rounded-tl-sm border border-border shadow-sm inline-block">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-foreground mb-1">
                        {comment.author.name}
                        {comment.author.role === "SELLER" &&
                          comment.author.subscription?.status === "ACTIVE" && (
                            <BadgeCheck className="w-3.5 h-3.5 text-primary" />
                          )}
                        {comment.author.role === "SELLER" &&
                          (comment.author.subscription?.status === "ACTIVE" ? (
                            <span className="px-1.5 py-0.5 bg-yellow-400/10 text-yellow-600 dark:text-yellow-500 text-[8px] rounded-md uppercase tracking-wider ml-1 border border-yellow-400/20">
                              Premium
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] rounded-md uppercase tracking-wider ml-1 border border-primary/20">
                              Seller
                            </span>
                          ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground italic relative">
                <div className="absolute top-2 -left-[23px] w-2.5 h-2.5 bg-muted border-2 border-border rounded-full z-10"></div>
                Be the first to reply.
              </div>
            )}

            {isAuthenticated && (
              <div className="relative pt-2">
                <div className="absolute top-6 -left-[23px] w-2.5 h-2.5 bg-primary border-2 border-border rounded-full z-10 shadow-[0_0_8px_rgb(34,197,94,0.4)]"></div>
                <form
                  onSubmit={handleAddComment}
                  className="flex gap-3 items-start"
                >
                  <div className="hidden sm:flex w-8 h-8 bg-primary/10 rounded-full items-center justify-center text-primary font-bold overflow-hidden border border-primary/20 shrink-0 mt-0.5 relative">
                    {user?.profilePicture ? (
                      <Image
                        src={user.profilePicture}
                        alt="You"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xs">
                        {user?.name?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 bg-background border border-border rounded-xl focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all overflow-hidden flex flex-col">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Reply to this post..."
                      className="w-full bg-transparent text-sm text-foreground p-3 outline-none resize-none min-h-[44px] max-h-32"
                      rows={1}
                    />
                    <div className="flex justify-end p-2 bg-muted/30 border-t border-border">
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="bg-primary text-primary-foreground font-bold text-xs px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-xl shadow-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Report Post</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleReport} className="p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full border border-border bg-muted rounded-lg p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="illegal">Illegal Content</option>
                  <option value="misinformation">Misinformation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Details (optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full border border-border bg-muted rounded-lg p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-green-500 resize-none h-20"
                  placeholder="Provide more details..."
                  maxLength={500}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReporting}
                  className="px-4 py-2 text-sm bg-orange-600 text-white hover:bg-orange-700/90 rounded-lg transition disabled:opacity-50"
                >
                  {isReporting ? "Reporting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
