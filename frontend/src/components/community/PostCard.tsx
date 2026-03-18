'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, MoreHorizontal, BadgeCheck, Flag, AlertTriangle, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

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

export default function PostCard({ post, onLikeToggle, onDelete }: PostCardProps) {
    const { user, token } = useAuthStore();
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
    const [newComment, setNewComment] = useState('');
    const [commentsCountState, setCommentsCountState] = useState(post.commentsCount);

    // Report State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('spam');
    const [reportDetails, setReportDetails] = useState('');
    const [isReporting, setIsReporting] = useState(false);

    const isAuthor = user?.id === post.author.id;

    const handleLike = async () => {
        if (!token) return;

        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

        if (newLikedState) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 500);
        }

        try {
            await api.post(`/community/posts/${post.id}/like`, {}, token);
            onLikeToggle();
        } catch (error) {
            setIsLiked(!newLikedState);
            setLikesCount(prev => !newLikedState ? prev + 1 : prev - 1);
        }
    };

    const handleSaveEdit = async () => {
        if (!editContent.trim()) return;
        setIsSaving(true);
        try {
            await api.put(`/community/posts/${post.id}`, {
                content: editContent,
                imageUrl: post.imageUrl
            }, token!);

            setCurrentContent(editContent);
            setIsEditing(false);
            setShowMenu(false);
        } catch (error) {
            alert('Failed to update post');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await api.delete(`/community/posts/${post.id}`, token!);
            if (onDelete) onDelete(post.id);
        } catch (error) {
            alert('Failed to delete post');
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
        if (!newComment.trim() || !token) return;

        try {
            const comment = await api.post(`/community/posts/${post.id}/comments`, {
                content: newComment
            }, token);

            setComments(prev => [...prev, comment]);
            setNewComment('');
            setCommentsCountState(prev => prev + 1);
        } catch (error) {
            console.error("Failed to add comment", error);
        }
    };

    const handleReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setIsReporting(true);
        try {
            await api.post(`/community/posts/${post.id}/report`, {
                reason: reportReason,
                details: reportDetails
            }, token);
            alert('Post reported successfully');
            setShowReportModal(false);
            setReportDetails('');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to report post');
        } finally {
            setIsReporting(false);
        }
    };

    if (post.status === 'SUSPENDED') {
        return (
            <div className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 border rounded-xl overflow-hidden shadow-sm relative p-4 flex gap-4 items-center">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                    <h3 className="text-red-700 dark:text-red-400 font-semibold text-sm">Post Suspended</h3>
                    <p className="text-red-600/80 dark:text-red-400/80 text-xs mt-0.5">This post has been removed for violating community guidelines.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card border-border text-card-foreground border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition relative">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden border border-primary/30 shrink-0 relative">
                        {post.author.profilePicture && !imageError ? (
                            <Image
                                src={post.author.profilePicture}
                                alt={post.author.name}
                                fill
                                className="object-cover"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <span className="text-primary font-bold">{post.author.name.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-foreground flex items-center gap-1">
                            {post.author.name}
                            {post.author.role === 'SELLER' && post.author.subscription?.status === 'ACTIVE' && (
                                <BadgeCheck className="w-4 h-4 text-blue-500" />
                            )}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center flex-wrap gap-1">
                            {new Date(post.createdAt).toLocaleDateString()}
                            {(post.isEdited || currentContent !== post.content) && <span className="text-[10px] italic">(edited)</span>}
                            {post.author.role === 'SELLER' && (
                                post.author.subscription?.status === 'ACTIVE' ? (
                                    <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500 text-[10px] rounded-full font-bold">PREMIUM</span>
                                ) : (
                                    <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] rounded-full font-bold">SELLER</span>
                                )
                            )}
                        </p>
                    </div>
                </div>

                {/* Right side: tag badge + menu */}
                <div className="flex items-center gap-2">
                    {post.tag && post.tag !== 'general' && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            post.tag === 'marketplace' ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-600' :
                            post.tag === 'listing' ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-600' :
                            post.tag === 'vendor' ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-600' :
                            post.tag === 'growing-tips' ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-600' :
                            post.tag === 'questions' ? 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-600' :
                            'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                        }`}>
                            {post.tag === 'marketplace' ? '🛒 Marketplace' :
                             post.tag === 'listing' ? '📋 Listing' :
                             post.tag === 'vendor' ? '🏪 Vendor' :
                             post.tag === 'growing-tips' ? '🌱 Growing Tips' :
                             post.tag === 'questions' ? '❓ Questions' :
                             post.tag}
                        </span>
                    )}

                    {isAuthor && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
                            >
                                <MoreHorizontal size={20} />
                            </button>

                            {showMenu && (
                                <div className="absolute right-0 top-8 bg-card border-border border rounded-lg shadow-lg py-1 w-32 z-10">
                                    <button
                                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className={`px-4 pb-2 ${post.imageUrl ? 'mb-2' : ''}`}>
                {isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full border border-border bg-muted text-foreground rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500 outline-none resize-none"
                            rows={3}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-foreground whitespace-pre-wrap">{currentContent}</p>
                )}
            </div>

            {/* Image */}
            {post.imageUrl && (
                <div className="w-full bg-muted">
                    <img
                        src={post.imageUrl}
                        alt="Post content"
                        className="w-full h-auto object-contain max-h-[500px]"
                    />
                </div>
            )}

            {/* Actions */}
            <div className="p-4 border-t border-border flex items-center gap-6">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 text-sm transition ${isLiked ? 'text-red-500 font-semibold' : 'text-muted-foreground hover:text-red-500'}`}
                >
                    <Heart size={20} className={`${isLiked ? 'fill-current' : ''} ${isAnimating ? 'animate-bounce' : ''}`} />
                    <span>{likesCount}</span>
                </button>

                <button
                    onClick={toggleComments}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-blue-500 transition"
                >
                    <MessageCircle size={20} />
                    <span>{commentsCountState}</span>
                </button>

                <div className="flex items-center gap-2 ml-auto">
                    {!isAuthor && user && (
                        <button 
                            onClick={() => setShowReportModal(true)}
                            className="text-muted-foreground hover:text-orange-500 transition p-1"
                            title="Report post"
                        >
                            <Flag size={18} />
                        </button>
                    )}
                    <button className="text-muted-foreground hover:text-primary transition p-1">
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="px-4 pb-4 bg-muted/30 border-t border-border">
                    <div className="space-y-4 pt-4">
                        {commentsLoading ? (
                            <div className="text-center text-xs text-muted-foreground">Loading comments...</div>
                        ) : comments.length > 0 ? (
                            comments.map((comment: any) => (
                                <div key={comment.id} className="flex gap-2">
                                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center overflow-hidden text-xs font-bold text-muted-foreground relative border border-border">
                                        {comment.author.profilePicture ? (
                                            <Image
                                                src={comment.author.profilePicture}
                                                alt={comment.author.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span>{comment.author.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="bg-card text-card-foreground p-2 rounded-lg text-sm border border-border flex-1">
                                        <div className="flex items-center gap-1 font-semibold text-xs text-foreground">
                                            {comment.author.name}
                                            {comment.author.role === 'SELLER' && comment.author.subscription?.status === 'ACTIVE' && (
                                                <BadgeCheck className="w-3 h-3 text-blue-500" />
                                            )}
                                            {comment.author.role === 'SELLER' && (
                                                comment.author.subscription?.status === 'ACTIVE' ? (
                                                    <span className="px-1 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500 text-[8px] rounded-full font-bold ml-1">PREMIUM</span>
                                                ) : (
                                                    <span className="px-1 py-0.5 bg-primary/20 text-primary text-[8px] rounded-full font-bold ml-1">SELLER</span>
                                                )
                                            )}
                                        </div>
                                        <p className="text-muted-foreground">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-xs text-muted-foreground">No comments yet.</div>
                        )}

                        {token && (
                            <form onSubmit={handleAddComment} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="flex-1 text-sm border border-border bg-card text-foreground rounded-full px-4 py-2 outline-none focus:border-green-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="text-primary font-semibold text-sm disabled:opacity-50"
                                >
                                    Post
                                </button>
                            </form>
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
                            <button onClick={() => setShowReportModal(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleReport} className="p-4 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Reason</label>
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
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Details (optional)</label>
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
                                    {isReporting ? 'Reporting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
