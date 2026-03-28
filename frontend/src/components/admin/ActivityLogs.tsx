"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Log = {
  id: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    role: string;
    profilePicture?: string;
  };
};

export default function ActivityLogs({ token }: { token: string | null }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 20;

  // Filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("ALL");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", logsPerPage.toString());

      if (search) queryParams.append("search", search);
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      // Allow backend filtering for category if supported or client-side filtering?
      // Current backend implementation supports 'action' filter which maps to category values slightly differently
      // but let's stick to client-side filtering for category for now since backend 'action' is exact match
      // improved backend plan would be to map category to actions or use constraints
      const queryString = queryParams.toString();
      const endpoint = `/admin/logs${queryString ? `?${queryString}` : ""}`;

      const res: any = await api.get(endpoint, token || undefined);

      // Check if response is paginated object or array (backward compatibility check though we just changed backend)
      if (res && res.logs && Array.isArray(res.logs)) {
        setLogs(res.logs);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalLogs(res.pagination.total);
        }
      } else if (Array.isArray(res)) {
        // Fallback if backend reverted or somehow different
        setLogs(res);
        setTotalPages(1);
        setTotalLogs(res.length);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchLogs();
    }, 500); // Debounce search
    return () => clearTimeout(timeout);
  }, [search, startDate, endDate, token, currentPage]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate, category]);

  const getFilteredLogs = () => {
    // Since backend handles basic filtering (search, date), we just filter by Category locally
    // IF backend doesn't support generic category.
    // Ideally backend should handle this to accurate pagination.
    // For now, if we filter deeply on client side, pagination might look weird
    // (e.g. page 1 has 20 items, but only 2 match category).
    // For 'ALL', it works perfectly.

    if (category === "ALL") return logs;

    return logs.filter((log) => {
      if (category === "AUTH")
        return ["LOGIN", "SIGNUP"].some((a) => log.action.includes(a));
      if (category === "MARKETPLACE")
        return ["LISTING"].some((a) => log.action.includes(a));
      if (category === "COMMUNITY")
        return ["POST", "COMMENT", "LIKE"].some((a) => log.action.includes(a));
      if (category === "ADMIN")
        return ["APPROVE", "REJECT", "WARN", "UPDATE_USER", "BANNER"].some(
          (a) => log.action.includes(a),
        );
      return true;
    });
  };

  const displayLogs = getFilteredLogs();

  const renderDetails = (detailsRaw: string) => {
    let details: any;
    try {
      details =
        typeof detailsRaw === "string" ? JSON.parse(detailsRaw) : detailsRaw;
    } catch {
      return <span className="text-gray-500">{String(detailsRaw)}</span>;
    }

    if (typeof details !== "object" || details === null)
      return <span>{String(details)}</span>;

    // Rich Listing Preview (Snapshot)
    if (details.listingTitle || details.listingImage) {
      return (
        <div className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-100 dark:border-gray-700">
          {details.listingImage ? (
            <img
              src={details.listingImage}
              alt="Preview"
              className="w-12 h-12 rounded object-cover border"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500">
              No Img
            </div>
          )}
          <div className="min-w-0">
            <div
              className="font-medium text-sm truncate max-w-[200px]"
              title={details.listingTitle}
            >
              {details.listingTitle || "Untitled Listing"}
            </div>
            <div className="text-xs text-gray-400 font-mono truncate max-w-[150px]">
              ID: {details.listingId}
            </div>
            {details.status && (
              <div
                className={`text-xs font-medium mt-0.5 ${
                  details.status === "ACTIVE" || details.status === "APPROVED"
                    ? "text-green-600"
                    : details.status === "REJECTED"
                      ? "text-red-600"
                      : "text-gray-500"
                }`}
              >
                Status:{" "}
                {details.status === "ACTIVE"
                  ? "Approved"
                  : details.status === "REJECTED"
                    ? "Rejected"
                    : details.status}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Generic Key-Value rendering for other logs
    return (
      <div className="space-y-1">
        {Object.entries(details).map(([key, value]) => {
          if (key === "ip" || key === "device" || key === "location")
            return null; // Skip technical fields if they clutter

          let displayValue = String(value);
          let displayKey = key;

          if (key === "status") {
            if (displayValue === "ACTIVE") displayValue = "Approved";
            if (displayValue === "REJECTED") displayValue = "Rejected";
          }

          return (
            <div key={key} className="text-xs wrap-break-word">
              <span className="font-semibold text-gray-600 dark:text-gray-400 capitalize">
                {displayKey.replace(/([A-Z])/g, " $1").trim()}:{" "}
              </span>
              <span className="text-gray-800 dark:text-gray-200">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle>Activity Logs</CardTitle>
            <CardDescription>Monitor all system activities.</CardDescription>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search by user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:max-w-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-auto"
            />
            <span className="self-center text-gray-500 text-center sm:text-left">
              to
            </span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        <div className="mt-4">
          <Tabs
            defaultValue="ALL"
            onValueChange={setCategory}
            className="w-full"
          >
            <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 p-1 bg-muted/50">
              <TabsTrigger value="ALL" className="grow sm:grow-0">
                All Activities
              </TabsTrigger>
              <TabsTrigger value="AUTH" className="grow sm:grow-0">
                Authentication
              </TabsTrigger>
              <TabsTrigger value="MARKETPLACE" className="grow sm:grow-0">
                Marketplace
              </TabsTrigger>
              <TabsTrigger value="COMMUNITY" className="grow sm:grow-0">
                Community
              </TabsTrigger>
              <TabsTrigger value="ADMIN" className="grow sm:grow-0">
                Admin Actions
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading logs...</div>
        ) : displayLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No logs found matching your criteria.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <Card className="hidden md:block overflow-hidden shadow-sm border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground whitespace-nowrap">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Date & Time</th>
                      <th className="px-6 py-4 font-semibold">Action</th>
                      <th className="px-6 py-4 font-semibold">User</th>
                      <th className="px-6 py-4 font-semibold w-[300px]">
                        Details
                      </th>
                      <th className="px-6 py-4 font-semibold">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {displayLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="group even:bg-muted/20 odd:bg-transparent hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              log.action.includes("REJECT") ||
                              log.action.includes("DELETE")
                                ? "bg-red-500/10 text-red-600 border-red-500/20"
                                : log.action.includes("APPROVE") ||
                                    log.action.includes("CREATE")
                                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                                  : log.action.includes("WARN")
                                    ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                    : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {log.user ? (
                            <div className="flex items-center gap-3">
                              {log.user.profilePicture ? (
                                <img
                                  src={log.user.profilePicture}
                                  alt={log.user.name}
                                  className="w-8 h-8 rounded-full object-cover border border-border"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/20">
                                  {log.user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-foreground">
                                  {log.user.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {log.user.email}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="italic text-muted-foreground">
                              System
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {renderDetails(log.details)}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {log.ipAddress}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {displayLogs.map((log) => (
                <Card key={log.id} className="overflow-hidden shadow-sm">
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-start border-b border-border/40 pb-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          log.action.includes("REJECT") ||
                          log.action.includes("DELETE")
                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                            : log.action.includes("APPROVE") ||
                                log.action.includes("CREATE")
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : log.action.includes("WARN")
                                ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">
                        User
                      </div>
                      {log.user ? (
                        <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-md">
                          {log.user.profilePicture ? (
                            <img
                              src={log.user.profilePicture}
                              alt={log.user.name}
                              className="w-8 h-8 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/20">
                              {log.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {log.user.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.user.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="italic text-muted-foreground text-sm">
                          System
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">
                      Details
                    </div>
                    <div className="bg-muted p-2 rounded text-sm text-foreground">
                      {renderDetails(log.details)}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/40 flex justify-end">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      IP: {log.ipAddress}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * logsPerPage + 1} to{" "}
                {Math.min(currentPage * logsPerPage, totalLogs)} of {totalLogs}{" "}
                entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center px-2 text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
