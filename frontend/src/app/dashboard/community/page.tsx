'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import PostCard from '@/components/community/PostCard';
import CommunitySidebar from '@/components/community/CommunitySidebar';
import { Image as ImageIcon, Send, ChevronDown, Menu, X } from 'lucide-react';

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
    { tag: 'general', label: '💬 General', color: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600' },
    { tag: 'marketplace', label: '🛒 Marketplace', color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-600' },
    { tag: 'listing', label: '📋 Listing', color: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-600' },
    { tag: 'vendor', label: '🏪 Vendor', color: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-600' },
    { tag: 'growing-tips', label: '🌱 Growing Tips', color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-600' },
    { tag: 'questions', label: '❓ Questions', color: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-600' },
];

const SORT_OPTIONS = [
    { value: 'new', label: '🆕 New' },
    { value: 'top', label: '🏆 Top' },
    { value: 'hot', label: '🔥 Hot' },
];

export default function CommunityPage() {
    const { user, token } = useAuthStore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState('new');
    const [showSidebar, setShowSidebar] = useState(false);

    // Create Post State
    const [newContent, setNewContent] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const [showImageInput, setShowImageInput] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [selectedPostTag, setSelectedPostTag] = useState('general');

    const fetchFeed = useCallback(async () => {
        setLoading(true);
        try {
            const url = selectedTag
                ? `/community/feed?tag=${selectedTag}`
                : '/community/feed';
            const data = await api.get(url, token || undefined);
            if (Array.isArray(data)) {
                setPosts(data);
            }
        } catch (error) {
            console.error('Failed to fetch feed', error);
        } finally {
            setLoading(false);
        }
    }, [token, selectedTag]);

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
        if (!token) return;

        setIsPosting(true);
        try {
            let uploadedImageUrl = '';

            if (selectedFile) {
                const formData = new FormData();
                formData.append('image', selectedFile);

                const uploadRes = await fetch('http://localhost:4000/api/upload/image', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (!uploadRes.ok) throw new Error('Upload failed');
                const uploadData = await uploadRes.json();
                uploadedImageUrl = uploadData.url;
            }

            await api.post('/community/posts', {
                content: newContent,
                imageUrl: uploadedImageUrl || undefined,
                tag: selectedPostTag
            }, token);

            setNewContent('');
            setSelectedFile(null);
            setPreviewUrl(null);
            setShowImageInput(false);
            setSelectedPostTag('general');
            fetchFeed();
        } catch (error) {
            console.error(error);
            alert('Failed to post');
        } finally {
            setIsPosting(false);
        }
    };

    const handleDeletePost = (id: string) => {
        setPosts(prev => prev.filter(p => p.id !== id));
    };

    const selectedTagInfo = POST_TAGS.find(t => t.tag === selectedTag);

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
                            <h2 className="font-bold text-base text-foreground">Topics &amp; Tags</h2>
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
                            <span className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border font-semibold ${selectedTagInfo.color}`}>
                                {selectedTagInfo.label}
                                <button onClick={() => setSelectedTag(null)} className="ml-1 opacity-70 hover:opacity-100">
                                    <X size={12} />
                                </button>
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">All Posts</span>
                        )}
                    </div>

                    {/* Active Filter Banner — desktop only */}
                    {selectedTag && selectedTagInfo && (
                        <div className={`hidden lg:flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium ${selectedTagInfo.color}`}>
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
                        <div className="bg-card border border-border rounded-xl shadow-sm p-4">
                            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <span>✍️</span> Create a post
                            </h2>
                            <form onSubmit={handleCreatePost} className="space-y-3">
                                <div className="flex gap-3">
                                    {/* Avatar hidden on very small screens */}
                                    <div className="hidden sm:flex w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center text-green-700 dark:text-green-300 font-bold shrink-0 overflow-hidden border border-green-200 dark:border-green-700">
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
                                    <textarea
                                        value={newContent}
                                        onChange={(e) => setNewContent(e.target.value)}
                                        placeholder="What's growing on?"
                                        className="flex-1 bg-muted text-foreground rounded-lg p-3 border border-border focus:outline-none focus:ring-1 focus:ring-green-500 resize-none h-20 text-sm"
                                    />
                                </div>

                                {/* Tag Selector */}
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Choose a tag:</p>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {POST_TAGS.map(t => (
                                            <button
                                                key={t.tag}
                                                type="button"
                                                onClick={() => setSelectedPostTag(t.tag)}
                                                className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                                                    selectedPostTag === t.tag
                                                        ? `${t.color} ring-2 ring-offset-1 ring-current`
                                                        : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                                                }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Image Upload */}
                                {showImageInput && (
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="block w-full text-sm text-muted-foreground
                                                file:mr-4 file:py-1.5 file:px-3
                                                file:rounded-full file:border-0
                                                file:text-xs file:font-semibold
                                                file:bg-primary/20 file:text-primary
                                                hover:file:bg-primary/30"
                                        />
                                        {previewUrl && (
                                            <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-1 border-t border-border">
                                    <button
                                        type="button"
                                        onClick={() => setShowImageInput(!showImageInput)}
                                        className={`p-2 rounded-full transition text-sm flex items-center gap-1 ${showImageInput ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}
                                    >
                                        <ImageIcon size={18} />
                                        <span className="text-xs">Photo</span>
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isPosting || (!newContent.trim() && !selectedFile)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                                    >
                                        <Send size={15} />
                                        {isPosting ? 'Posting...' : 'Post'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-xl p-5 text-center text-muted-foreground text-sm shadow-sm">
                            Please <a href="/login" className="text-primary underline font-semibold">login</a> to post in the community.
                        </div>
                    )}

                    {/* Sort Bar */}
                    <div className="bg-card border border-border rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setSortBy(opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                    sortBy === opt.value
                                        ? 'bg-primary/10 text-primary font-semibold'
                                        : 'text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Feed */}
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-card border border-border h-48 rounded-xl shadow-sm animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.length === 0 ? (
                                <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
                                    <p className="text-4xl mb-3">🌱</p>
                                    <p className="font-semibold text-foreground mb-1">
                                        {selectedTag ? `No posts tagged "${selectedTagInfo?.label}"` : 'No posts yet'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedTag ? 'Try a different tag or be the first to post!' : 'Be the first to share!'}
                                    </p>
                                </div>
                            ) : (
                                posts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onLikeToggle={() => { }}
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
                            <h3 className="font-bold text-sm text-foreground mb-3">🔗 Quick Links</h3>
                            <div className="space-y-3">
                                <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition">Community Guidelines</a>
                                <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition">Frequently Asked Questions</a>
                                <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition">Contact Support</a>
                            </div>
                        </div>
                        <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 shadow-sm">
                            <h3 className="font-bold text-sm text-green-800 dark:text-green-300 mb-2">🌿 Greenery Community</h3>
                            <p className="text-xs text-green-700 dark:text-green-400">A safe space for cannabis enthusiasts. Connect, share, and grow together.</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
