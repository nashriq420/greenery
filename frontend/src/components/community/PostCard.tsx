'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Post {
    id: string;
    content: string;
    imageUrl?: string | null;
    isEdited: boolean;
    createdAt: string;
    author: {
        id: string;
        name: string;
        role: string;
        profilePicture?: string | null;
    };
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
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

    return (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition relative">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center overflow-hidden border border-green-200 shrink-0 relative">
                        {post.author.profilePicture && !imageError ? (
                            <Image
                                src={post.author.profilePicture}
                                alt={post.author.name}
                                fill
                                className="object-cover"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <span className="text-green-700 font-bold">{post.author.name.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-gray-900">{post.author.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            {new Date(post.createdAt).toLocaleDateString()}
                            {(post.isEdited || currentContent !== post.content) && <span className="text-[10px] italic">(edited)</span>}
                            {post.author.role === 'SELLER' && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-bold">SELLER</span>}
                        </p>
                    </div>
                </div>

                {isAuthor && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                        >
                            <MoreHorizontal size={20} />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 w-32 z-10">
                                <button
                                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={`px-4 pb-2 ${post.imageUrl ? 'mb-2' : ''}`}>
                {isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full border rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500 outline-none resize-none"
                            rows={3}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-800 whitespace-pre-wrap">{currentContent}</p>
                )}
            </div>

            {/* Image */}
            {post.imageUrl && (
                <div className="w-full bg-gray-100">
                    <img
                        src={post.imageUrl}
                        alt="Post content"
                        className="w-full h-auto object-contain max-h-[500px]"
                    />
                </div>
            )}

            {/* Actions */}
            <div className="p-4 border-t flex items-center gap-6">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 text-sm transition ${isLiked ? 'text-red-500 font-semibold' : 'text-gray-500 hover:text-red-500'}`}
                >
                    <Heart size={20} className={`${isLiked ? 'fill-current' : ''} ${isAnimating ? 'animate-bounce' : ''}`} />
                    <span>{likesCount}</span>
                </button>

                <button
                    onClick={toggleComments}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition"
                >
                    <MessageCircle size={20} />
                    <span>{commentsCountState}</span>
                </button>

                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-500 transition ml-auto">
                    <Share2 size={20} />
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="px-4 pb-4 bg-gray-50 border-t">
                    <div className="space-y-4 pt-4">
                        {commentsLoading ? (
                            <div className="text-center text-xs text-gray-400">Loading comments...</div>
                        ) : comments.length > 0 ? (
                            comments.map((comment: any) => (
                                <div key={comment.id} className="flex gap-2">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden text-xs font-bold text-gray-600 relative">
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
                                    <div className="bg-white p-2 rounded-lg text-sm border flex-1">
                                        <div className="font-semibold text-xs text-gray-700">{comment.author.name}</div>
                                        <p className="text-gray-600">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-xs text-gray-400">No comments yet.</div>
                        )}

                        {token && (
                            <form onSubmit={handleAddComment} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="flex-1 text-sm border rounded-full px-4 py-2 outline-none focus:border-green-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="text-green-600 font-semibold text-sm disabled:opacity-50"
                                >
                                    Post
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
