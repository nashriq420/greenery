'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Post {
    id: string;
    content: string;
    imageUrl?: string | null;
    createdAt: string;
    author: {
        id: string;
        name: string;
        role: string;
    };
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
}

interface PostCardProps {
    post: Post;
    onLikeToggle: () => void;
}

export default function PostCard({ post, onLikeToggle }: PostCardProps) {
    const { token } = useAuthStore();
    const [isLiked, setIsLiked] = useState(post.isLiked);
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleLike = async () => {
        if (!token) return;

        // Optimistic update
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

        if (newLikedState) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 500);
        }

        try {
            await api.post(`/community/posts/${post.id}/like`, {}, token);
            onLikeToggle(); // Notify parent to refresh or sync if needed
        } catch (error) {
            // Revert on error
            setIsLiked(!newLikedState);
            setLikesCount(prev => !newLikedState ? prev + 1 : prev - 1);
        }
    };

    return (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                        {post.author.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-gray-900">{post.author.name}</h3>
                        <p className="text-xs text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                            {post.author.role === 'SELLER' && <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-bold">SELLER</span>}
                        </p>
                    </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {/* Content */}
            <div className={`px-4 pb-2 ${post.imageUrl ? 'mb-2' : ''}`}>
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Image */}
            {post.imageUrl && (
                <div className="w-full relative bg-gray-100 aspect-video">
                    <img
                        src={post.imageUrl}
                        alt="Post content"
                        className="w-full h-full object-cover"
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

                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition">
                    <MessageCircle size={20} />
                    <span>{post.commentsCount}</span>
                </button>

                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-500 transition ml-auto">
                    <Share2 size={20} />
                </button>
            </div>
        </div>
    );
}
