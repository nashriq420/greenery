'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import PostCard from '@/components/community/PostCard';
import { Image as ImageIcon, Send } from 'lucide-react';

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

export default function CommunityPage() {
    const { user, token } = useAuthStore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Post State
    const [newContent, setNewContent] = useState('');
    const [newImageUrl, setNewImageUrl] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [showImageInput, setShowImageInput] = useState(false);

    const fetchFeed = async () => {
        try {
            const data = await api.get('/community/feed', token || undefined);
            if (Array.isArray(data)) {
                setPosts(data);
            }
        } catch (error) {
            console.error("Failed to fetch feed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
    }, [token]);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContent.trim() && !newImageUrl.trim()) return;
        if (!token) return;

        setIsPosting(true);
        try {
            await api.post('/community/posts', {
                content: newContent,
                imageUrl: newImageUrl || undefined
            }, token);

            // Reset and refresh
            setNewContent('');
            setNewImageUrl('');
            setShowImageInput(false);
            fetchFeed();
        } catch (error) {
            alert('Failed to post');
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h1 className="text-2xl font-bold text-green-900 mb-2">Community Feed 🌿</h1>
                <p className="text-gray-500 mb-6">Connect with other growers and enthusiasts.</p>

                {/* Create Post Widget */}
                {user ? (
                    <form onSubmit={handleCreatePost} className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold flex-shrink-0">
                                {user.name.charAt(0)}
                            </div>
                            <div className="flex-1 space-y-3">
                                <textarea
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    placeholder="What's growing on?"
                                    className="w-full bg-gray-50 rounded-lg p-3 border-none focus:ring-1 focus:ring-green-500 resize-none h-24"
                                />

                                {showImageInput && (
                                    <input
                                        type="text"
                                        placeholder="Image URL (https://...)"
                                        value={newImageUrl}
                                        onChange={(e) => setNewImageUrl(e.target.value)}
                                        className="w-full text-sm border rounded p-2"
                                    />
                                )}

                                <div className="flex justify-between items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowImageInput(!showImageInput)}
                                        className={`p-2 rounded-full hover:bg-gray-100 transition ${showImageInput ? 'text-green-600 bg-green-50' : 'text-gray-400'}`}
                                    >
                                        <ImageIcon size={20} />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isPosting || (!newContent.trim() && !newImageUrl)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Send size={16} />
                                        {isPosting ? 'Posting...' : 'Post'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500 text-sm">
                        Please <a href="/login" className="text-green-600 underline">login</a> to post.
                    </div>
                )}
            </div>

            {/* Feed */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white h-48 rounded-xl shadow-sm border animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No posts yet. Be the first to share!
                        </div>
                    ) : (
                        posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onLikeToggle={() => { }} // Optimistic update handles generic UI, could refetch if needed
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
