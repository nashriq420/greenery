"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING"); // PENDING, APPROVED, REJECTED

  const { isAuthenticated } = useAuthStore();

  // Helper for image URLs
  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;

    let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
    if (baseUrl === "/api") baseUrl = "http://localhost:4000";

    if (path.startsWith("/uploads") && baseUrl.endsWith("/api")) {
      baseUrl = baseUrl.slice(0, -4);
    }

    return `${baseUrl}${path}`;
  };

  // Approval Modal
  const [approvingBanner, setApprovingBanner] = useState<any>(null);
  const [startDate, setStartDate] = useState("");

  const fetchBanners = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const apiStatus = statusFilter === "EXPIRED" ? "APPROVED" : statusFilter;
      const res = await api.get(`/banners?status=${apiStatus}`);
      setBanners(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBanners();
    }
  }, [statusFilter, isAuthenticated]);

  const handleApproveClick = (banner: any) => {
    setApprovingBanner(banner);
    // Default to today
    setStartDate(new Date().toISOString().split("T")[0]);
  };

  const confirmApprove = async () => {
    if (!startDate || !isAuthenticated) return;
    try {
      await api.put(
        `/banners/${approvingBanner.id}/approve`,
        { startDate });
      setApprovingBanner(null);
      fetchBanners();
      alert("Banner approved successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error approving banner");
    }
  };

  const handleReject = async (id: string) => {
    if (!isAuthenticated) return;
    if (!confirm("Reject this banner?")) return;
    try {
      await api.put(`/banners/${id}/reject`, {});
      fetchBanners();
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Schedule State
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  const handleEditClick = (banner: any) => {
    setEditingSchedule(banner);
    // Pre-fill with existing start date
    setStartDate(new Date(banner.startDate).toISOString().split("T")[0]);
  };

  const confirmEditSchedule = async () => {
    if (!startDate || !isAuthenticated) return;
    try {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      await api.put(
        `/banners/${editingSchedule.id}/schedule`,
        {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        });

      setEditingSchedule(null);
      fetchBanners();
      alert("Schedule updated!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error updating schedule");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Banner Management</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        {["PENDING", "APPROVED", "EXPIRED", "REJECTED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`pb-2 px-4 font-medium ${statusFilter === status ? "border-b-2 border-green-600 text-green-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {banners.filter((banner) => {
            if (statusFilter === "EXPIRED") {
              return (
                banner.status === "APPROVED" &&
                new Date(banner.endDate) < new Date()
              );
            }
            if (statusFilter === "APPROVED") {
              return (
                banner.status === "APPROVED" &&
                new Date(banner.endDate) >= new Date()
              );
            }
            return banner.status === statusFilter;
          }).length === 0 && (
            <p className="text-gray-500">
              No banners found with status {statusFilter}.
            </p>
          )}

          {banners
            .filter((banner) => {
              if (statusFilter === "EXPIRED") {
                return (
                  banner.status === "APPROVED" &&
                  new Date(banner.endDate) < new Date()
                );
              }
              if (statusFilter === "APPROVED") {
                return (
                  banner.status === "APPROVED" &&
                  new Date(banner.endDate) >= new Date()
                );
              }
              return banner.status === statusFilter;
            })
            .map((banner) => (
              <div
                key={banner.id}
                className="bg-white p-4 rounded shadow border flex gap-4"
              >
                <div className="w-48 h-24 bg-gray-100 rounded overflow-hidden shrink-0">
                  <img
                    src={getImageUrl(banner.imageUrl)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">
                        {banner.title || "No Title"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Seller: {banner.seller.name} ({banner.seller.email})
                      </p>
                      <p className="text-sm text-gray-600">
                        Listing: {banner.listing.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-gray-400">
                        Created:{" "}
                        {new Date(banner.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Dates if Approved/Expired */}
                  {banner.status === "APPROVED" && (
                    <div
                      className={`mt-2 p-2 rounded text-sm inline-block ${new Date(banner.endDate) < new Date() ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-800"}`}
                    >
                      <strong>
                        {new Date(banner.endDate) < new Date()
                          ? "Expired:"
                          : "Schedule:"}
                      </strong>{" "}
                      {new Date(banner.startDate).toDateString()} -{" "}
                      {new Date(banner.endDate).toDateString()}
                    </div>
                  )}

                  {/* Actions */}
                  {(banner.status === "PENDING" ||
                    banner.status === "APPROVED" ||
                    banner.status === "REJECTED") && (
                    <div className="mt-4 flex gap-2">
                      {(banner.status === "PENDING" ||
                        banner.status === "REJECTED") && (
                        <button
                          onClick={() => handleApproveClick(banner)}
                          className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700"
                        >
                          {banner.status === "REJECTED"
                            ? "Re-Approve"
                            : "Approve & Schedule"}
                        </button>
                      )}
                      {banner.status !== "REJECTED" && (
                        <button
                          onClick={() => handleReject(banner.id)}
                          className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700"
                        >
                          {banner.status === "APPROVED"
                            ? "Suspend / Reject"
                            : "Reject"}
                        </button>
                      )}
                      {banner.status === "APPROVED" && (
                        <button
                          onClick={() => handleEditClick(banner)}
                          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
                        >
                          Edit Date
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Approval Modal */}
      {approvingBanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="font-bold text-lg mb-4">Approve Banner</h3>
            <p className="mb-4 text-sm text-gray-600">
              Select the start date. The banner will run for 7 days from this
              date.
            </p>

            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              className="w-full border rounded p-2 mb-6"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setApprovingBanner(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="font-bold text-lg mb-4">Edit Banner Schedule</h3>
            <p className="mb-4 text-sm text-gray-600">
              Update the start date. End date updates automatically (+7 days).
            </p>

            <label className="block text-sm font-medium mb-1">
              New Start Date
            </label>
            <input
              type="date"
              className="w-full border rounded p-2 mb-6"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingSchedule(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmEditSchedule}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
