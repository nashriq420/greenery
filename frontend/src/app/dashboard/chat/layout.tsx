"use client";

import ChatSidebar from "./components/ChatSidebar";
import { usePathname } from "next/navigation";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Check if we are on the root /dashboard/chat page
  const isRoot = pathname === "/dashboard/chat";

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-muted">
      {/* Desktop Sidebar - Always visible on md+ */}
      {/* Mobile Sidebar - Only visible if on root page */}
      <div
        className={`
                w-full md:w-80 lg:w-96 border-r border-border bg-card shrink-0
                ${isRoot ? "block" : "hidden md:block"}
            `}
      >
        <ChatSidebar />
      </div>

      {/* Chat Area */}
      {/* On mobile, hidden if on root page (showing list instead) */}
      <div
        className={`
                flex-1 flex flex-col min-w-0 bg-card
                ${isRoot ? "hidden md:flex" : "flex"}
            `}
      >
        {children}
      </div>
    </div>
  );
}
