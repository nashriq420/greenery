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
import { PlusCircle, Search } from "lucide-react";
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
  const { token } = useAuthStore();
  const [reports, setReports] = useState<BlacklistReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.get("/blacklist/my-reports", token || undefined);
        setReports(data);
      } catch (error) {
        console.error("Failed to fetch user reports:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchReports();
    }
  }, [token]);

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
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <div
                className={`h-1.5 w-full ${
                  report.status === "APPROVED"
                    ? "bg-green-500"
                    : report.status === "REJECTED"
                      ? "bg-red-500"
                      : "bg-yellow-400"
                }`}
              />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-foreground">
                      {report.username}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Reported on{" "}
                      {new Date(report.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      report.status === "APPROVED"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900/50"
                        : report.status === "REJECTED"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/50"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50"
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="text-card-foreground">
                <div className="grid sm:grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="font-semibold text-muted-foreground">
                      Region:
                    </span>{" "}
                    {report.region}
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">
                      Contact:
                    </span>{" "}
                    {report.contactInfo}
                  </div>
                </div>
                <div className="bg-muted p-3 rounded text-sm text-foreground">
                  <span className="font-semibold block mb-1">Description:</span>
                  {report.description}
                </div>

                {report.adminComment && (
                  <div className="mt-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 p-3 rounded text-sm">
                    <span className="font-semibold text-blue-800 dark:text-blue-400 block mb-1">
                      Admin Comment:
                    </span>
                    <p className="text-blue-700 dark:text-blue-300">
                      {report.adminComment}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
