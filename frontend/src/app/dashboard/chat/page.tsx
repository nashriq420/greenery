"use client";

import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-muted-foreground/60" />
      </div>
      <h2 className="text-xl font-bold text-foreground">
        Select a conversation
      </h2>
      <p className="mt-2 text-sm max-w-xs mx-auto">
        Choose a chat from the list on the left to view messages or start a new
        conversation from the Marketplace.
      </p>
    </div>
  );
}
