import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { X, Send, Package } from "lucide-react";

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BroadcastModal({
  isOpen,
  onClose,
}: BroadcastModalProps) {
  const { isAuthenticated } = useAuthStore();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string>("");

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      api
        .get("/marketplace/my-listings")
        .then((data) => {
          if (Array.isArray(data)) {
            setListings(data.filter((l) => l.status === "ACTIVE" || l.active));
          }
        })
        .catch((err) =>
          console.error("Failed to load listings for broadcast", err),
        );
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleBroadcast = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setResultMsg("");
    try {
      const payload: any = { content };
      if (selectedListingId) payload.listingId = selectedListingId;

      const res = await api.post("/chat/broadcast", payload);
      setResultMsg(`Success: ${res.sentCount} message(s) sent.`);
      setTimeout(() => {
        onClose();
        setContent("");
        setSelectedListingId("");
        setResultMsg("");
      }, 2000);
    } catch (error: any) {
      setResultMsg(error.message || "Failed to send broadcast");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold text-lg">Broadcast Message</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-500">
            Send a message to everyone you've chatted with previously, as well
            as all users in your state.
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message..."
            className="w-full h-32 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          {listings.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                <Package className="w-4 h-4" /> Attach a Listing (Optional)
              </label>
              <select
                value={selectedListingId}
                onChange={(e) => setSelectedListingId(e.target.value)}
                className="w-full p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">-- No listing attached --</option>
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} (${Number(l.price).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {resultMsg && (
            <div
              className={`p-2 rounded text-sm ${resultMsg.startsWith("Success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
            >
              {resultMsg}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleBroadcast}
            disabled={loading || !content.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {loading ? "Sending..." : "Send Broadcast"}
          </button>
        </div>
      </div>
    </div>
  );
}
