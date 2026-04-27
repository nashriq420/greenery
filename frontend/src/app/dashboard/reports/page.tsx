"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, PlusCircle, Search, UserRound } from "lucide-react";
import Link from "next/link";

interface BlacklistReport {
  id: string;
  username: string;
  region: string;
  contactInfo: string;
  description: string;
  evidenceUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminComment?: string;
  createdAt: string;
}

export default function MyReportsPage() {
  const { isAuthenticated } = useAuthStore();
  const [reports, setReports] = useState<BlacklistReport[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusClass = (status: BlacklistReport["status"]) => {
    if (status === "APPROVED") {
      return "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400";
    }
    if (status === "REJECTED") {
      return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";
    }
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.get("/blacklist/my-reports");
        setReports(data);
      } catch (error) {
        console.error("Failed to fetch user reports:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchReports();
    }
  }, [isAuthenticated]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Track the status of scammers you have reported.
          </p>
        </div>
        <Link href="/dashboard/blacklist?tab=report">
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-card-foreground">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              No reports found
            </h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              You haven't reported anyone yet. If you encounter a scammer,
              please report them to help the community.
            </p>
            <Link href="/dashboard/blacklist?tab=report" className="mt-6">
              <Button variant="outline">Submit a Report</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {reports.map((report) => (
            <div
              key={report.id}
              className="grid gap-4 border-b border-border p-4 last:border-b-0 md:grid-cols-[minmax(220px,1fr)_minmax(220px,1.4fr)_auto] md:items-start"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">
                    {report.username}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                  {report.region && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {report.region}
                    </span>
                  )}
                </div>
                {report.contactInfo && (
                  <p className="text-sm text-muted-foreground">
                    Contact:{" "}
                    <span className="text-foreground">{report.contactInfo}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  {report.description || "No description provided."}
                </p>
                {report.adminComment && (
                  <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-semibold">Admin comment: </span>
                    {report.adminComment}
                  </div>
                )}
              </div>

              <span
                className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(report.status)}`}
              >
                {report.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
