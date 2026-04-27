"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

interface BlacklistReport {
  id: string;
  username: string;
  region: string;
  contactInfo: string;
  description: string;
  evidenceUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reporter?: {
    name: string;
    email: string;
  };
  adminComment?: string;
}

import EvidenceModal from "@/components/EvidenceModal";
import { getBaseUrl } from "@/lib/config";

export default function BlacklistManagement() {
  const { isAuthenticated } = useAuthStore();
  const [reports, setReports] = useState<BlacklistReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await api.get("/blacklist/admin");
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch admin blacklist reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    setProcessing(id);
    try {
      await api.put(`/blacklist/admin/${id}`, { status });
      // Update local state
      setReports(reports.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (error) {
      console.error("Failed to update report status:", error);
      alert("Failed to update status");
    } finally {
      setProcessing(null);
    }
  };

  const pendingReports = reports.filter((r) => r.status === "PENDING");
  const historyReports = reports.filter((r) => r.status !== "PENDING");

  const getFullEvidenceUrl = (url: string) => {
    return `${getBaseUrl()}${url}`;
  };

  return (
    <div className="space-y-8">
      <EvidenceModal
        isOpen={!!evidenceUrl}
        onClose={() => setEvidenceUrl(null)}
        url={evidenceUrl}
      />

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Blacklist Management
        </h1>
        <p className="text-gray-500">Review and manage reported scammers.</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
          Pending Reviews{" "}
          <span className="bg-yellow-500/20 text-yellow-600 border border-yellow-500/30 font-bold tracking-widest text-[10px] uppercase px-2 py-0.5 rounded-full">
            {pendingReports.length}
          </span>
        </h2>

        {pendingReports.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No pending reports.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingReports.map((report) => (
              <Card
                key={report.id}
                className="border-l-4 border-l-yellow-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <CardHeader className="pb-2 border-b border-border/40">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {report.username}
                        <span className="bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">
                          Pending
                        </span>
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Reported by{" "}
                        <span className="font-medium text-foreground">
                          {report.reporter?.name || "Anonymous"}
                        </span>{" "}
                        on {new Date(report.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                        disabled={processing === report.id}
                        onClick={() =>
                          handleUpdateStatus(report.id, "APPROVED")
                        }
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full sm:w-auto"
                        disabled={processing === report.id}
                        onClick={() =>
                          handleUpdateStatus(report.id, "REJECTED")
                        }
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-4 pt-4">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-border/40">
                        <span className="text-muted-foreground">Region:</span>
                        <span className="font-medium text-foreground">
                          {report.region}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/40">
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="font-medium text-foreground">
                          {report.contactInfo}
                        </span>
                      </div>
                      {report.evidenceUrl && (
                        <div className="flex justify-between items-center py-2 border-b border-border/40">
                          <span className="text-muted-foreground">
                            Evidence:
                          </span>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-blue-500"
                            onClick={() =>
                              setEvidenceUrl(
                                getFullEvidenceUrl(report.evidenceUrl!),
                              )
                            }
                          >
                            View Evidence
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 bg-muted/50 p-4 rounded-lg border border-border">
                      <div className="font-semibold text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                        Report Details
                      </div>
                      <p className="text-foreground leading-relaxed">
                        "{report.description}"
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">History</h2>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-4">
          {historyReports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No history found.
              </CardContent>
            </Card>
          ) : (
            historyReports.map((report) => (
              <Card key={report.id}>
                <CardHeader className="pb-2 border-b border-border/40">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-foreground">
                        {report.username}
                      </CardTitle>
                      <CardDescription className="text-sm mt-0.5">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${report.status === "APPROVED" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"}`}
                    >
                      {report.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-3 pt-3">
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">
                        Region:
                      </span>{" "}
                      {report.region}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">
                        Reporter:
                      </span>{" "}
                      {report.reporter?.name || "Anonymous"}
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={processing === report.id}
                      onClick={() =>
                        handleUpdateStatus(
                          report.id,
                          report.status === "APPROVED"
                            ? "REJECTED"
                            : "APPROVED",
                        )
                      }
                    >
                      {report.status === "APPROVED"
                        ? "Revoke Status"
                        : "Re-Approve"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Desktop View - Table */}
        <Card className="hidden md:block overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground whitespace-nowrap">
                <tr>
                  <th className="px-6 py-4 font-semibold">Scammer Name</th>
                  <th className="px-6 py-4 font-semibold">Region</th>
                  <th className="px-6 py-4 font-semibold">Reporter</th>
                  <th className="px-6 py-4 font-semibold">Date Reported</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {historyReports.map((report) => (
                  <tr
                    key={report.id}
                    className="group hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {report.username}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {report.region}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {report.reporter?.name || "Anonymous"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${report.status === "APPROVED" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`transition-colors h-8 text-xs ${report.status === "APPROVED" ? "hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30" : "hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30"}`}
                        disabled={processing === report.id}
                        onClick={() =>
                          handleUpdateStatus(
                            report.id,
                            report.status === "APPROVED"
                              ? "REJECTED"
                              : "APPROVED",
                          )
                        }
                      >
                        {report.status === "APPROVED"
                          ? "Revoke Status"
                          : "Re-Approve"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {historyReports.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No history found.
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
