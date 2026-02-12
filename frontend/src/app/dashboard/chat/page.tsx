'use client';

import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-700">Select a conversation</h2>
            <p className="mt-2 text-sm max-w-xs mx-auto">
                Choose a chat from the list on the left to view messages or start a new conversation from the Marketplace.
            </p>
        </div>
    );
}

