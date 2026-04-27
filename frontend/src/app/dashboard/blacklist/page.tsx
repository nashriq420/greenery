"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  Flag,
  Search,
  Filter,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Copy,
  Users,
  BookOpen,
  X,
  ExternalLink,
  ThumbsUp,
  Calendar,
  Phone,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlacklistReport {
  id: string;
  username: string;
  region: string;
  contactInfo: string;
  description: string;
  evidenceUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  updatedAt: string;
  createdAt: string;
  confirmationCount: number;
  confirmedByMe: boolean;
  reporter?: { name: string; profilePicture?: string };
}

type RiskLevel = "HIGH" | "MEDIUM" | "LOW";
type ReportView = "reports" | "report_user" | "safe_vendors";
type FilterTab = "all" | "vendors" | "users" | "high_risk" | "recent";

// ─── Mock enriched data ───────────────────────────────────────────────────────

const MOCK_TAGS = [
  ["Crypto Scam", "Ghosted", "No Delivery"],
  ["Short Weight", "No Delivery", "Ghosted"],
  ["Bulk Order Scam", "No Refund"],
  ["Fake Product", "No Delivery", "Refund Scam"],
  ["Short Weight", "Misleading Info"],
  ["Late Delivery", "Poor Communication"],
];

const MOCK_RISKS: RiskLevel[] = ["HIGH", "HIGH", "HIGH", "HIGH", "MEDIUM", "MEDIUM"];
const MOCK_ROLES = ["VENDOR", "USER", "VENDOR", "USER", "USER", "VENDOR"];
const MOCK_LOCATIONS = [
  { from: "🇺🇸 US", to: "California" },
  { from: "🇹🇭 Thailand", to: "Bangkok" },
  { from: "🇬🇧 UK", to: "Manchester" },
  { from: "🇩🇪 Germany", to: "Berlin" },
  { from: "🇨🇦 Canada", to: "Ontario" },
  { from: "🇺🇸 US", to: "Florida" },
];

const AVATAR_COLORS = [
  "bg-green-600",
  "bg-purple-600",
  "bg-blue-600",
  "bg-orange-500",
  "bg-teal-600",
  "bg-cyan-600",
];

const RECENTLY_REPORTED = [
  { username: "new_seller_88", country: "🇹🇭 Thailand", date: "Apr 2" },
  { username: "cloud9_plug", country: "🇺🇸 US", date: "Apr 1" },
  { username: "bud_master1", country: "🇨🇦 Canada", date: "Mar 31" },
];

const GUIDELINES = [
  "Report honest experiences",
  "No harassment or personal attacks",
  "Provide as much detail as possible",
  "False reports may result in suspension",
  "Respect and stay helpful",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  report: BlacklistReport;
  idx: number;
  onClose: () => void;
  onConfirm: (id: string) => void;
  confirming: boolean;
  isAuthenticated?: boolean;
}

function DetailModal({ report, idx, onClose, onConfirm, confirming, isAuthenticated }: DetailModalProps) {
  const risk = MOCK_RISKS[idx % MOCK_RISKS.length];
  const tags = MOCK_TAGS[idx % MOCK_TAGS.length];
  const role = MOCK_ROLES[idx % MOCK_ROLES.length];
  const loc = report.region
    ? { from: "", to: report.region }
    : MOCK_LOCATIONS[idx % MOCK_LOCATIONS.length];
  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

  const riskColor =
    risk === "HIGH"
      ? "bg-red-100 text-red-600 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30"
      : risk === "MEDIUM"
        ? "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30"
        : "bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f2318] border border-gray-200 dark:border-emerald-900/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-emerald-900/40">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span className="font-bold text-gray-900 dark:text-white">Report Details</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-emerald-900/30 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-base shrink-0`}>
              {getInitials(report.username)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {report.username}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-slate-700/60 dark:text-slate-300 border border-gray-200 dark:border-transparent font-medium">
                  {role}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${riskColor}`}>
                  {risk} RISK
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Reported {timeAgo(report.updatedAt)}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 rounded bg-green-100 border border-green-300 text-green-700 dark:bg-[#1a2e24] dark:border-emerald-900/40 dark:text-emerald-300/70"
              >
                {t}
              </span>
            ))}
          </div>

          {/* Info rows */}
          <div className="space-y-3 bg-gray-50 dark:bg-black/20 rounded-xl p-4 border border-gray-100 dark:border-emerald-900/30">
            {/* Date */}
            <div className="flex items-start gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Date Reported</div>
                <span className="text-gray-700 dark:text-slate-300">{formatDate(report.updatedAt)}</span>
              </div>
            </div>

            {/* Location */}
            {(report.region || loc.to) && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Location</div>
                  <span className="text-gray-700 dark:text-slate-300">
                    {loc.from ? `${loc.from} → ` : ""}{loc.to || report.region}
                  </span>
                </div>
              </div>
            )}

            {/* Contact */}
            {report.contactInfo && (
              <div className="flex items-start gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Contact / Telegram</div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-emerald-400 font-mono">{report.contactInfo}</span>
                    <button
                      onClick={() => copyToClipboard(report.contactInfo)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {report.description && (
              <div className="flex items-start gap-3 text-sm">
                <FileText className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Description</div>
                  <p className="text-gray-700 dark:text-slate-300 leading-relaxed">{report.description}</p>
                </div>
              </div>
            )}

            {/* Evidence */}
            {report.evidenceUrl && (
              <div className="flex items-start gap-3 text-sm">
                <ImageIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Evidence</div>
                  <a
                    href={report.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    View evidence <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Confirmation count */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
              <ThumbsUp className="w-4 h-4 text-green-600 dark:text-emerald-400" />
              <span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {report.confirmationCount}
                </span>{" "}
                community member{report.confirmationCount !== 1 ? "s" : ""} confirmed this report
              </span>
            </div>
          </div>

          {/* Reported by */}
          {report.reporter?.name && (
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Originally reported by{" "}
              <span className="font-semibold text-gray-600 dark:text-slate-400">
                {report.reporter.name}
              </span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-emerald-900/40 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-emerald-900/50 dark:text-slate-300 dark:hover:bg-emerald-900/20 transition-colors"
          >
            Close
          </button>
          {isAuthenticated && (
            <button
              onClick={() => onConfirm(report.id)}
              disabled={confirming}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                report.confirmedByMe
                  ? "bg-green-600 text-white hover:bg-green-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  : "bg-green-100 border border-green-400 text-green-700 hover:bg-green-200 dark:bg-emerald-700/30 dark:border-emerald-700/50 dark:text-emerald-300 dark:hover:bg-emerald-700/50"
              } disabled:opacity-60`}
            >
              <ThumbsUp className="w-4 h-4" />
              {confirming
                ? "Processing..."
                : report.confirmedByMe
                  ? "Confirmed ✓"
                  : `+ Confirm Report`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: RiskLevel }) {
  const cls =
    level === "HIGH"
      ? "bg-red-100 text-red-600 border border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30"
      : level === "MEDIUM"
        ? "bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30"
        : "bg-green-100 text-green-700 border border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${cls}`}>
      {level} RISK
    </span>
  );
}

function TagBadge({ label }: { label: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded bg-green-100 border border-green-300 text-green-700 dark:bg-[#1a2e24] dark:border-emerald-900/40 dark:text-emerald-300/70">
      {label}
    </span>
  );
}

function ConfirmedAvatars({ count }: { count: number }) {
  const show = Math.min(count, 3);
  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-1.5">
        {Array.from({ length: show }).map((_, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 border border-white dark:border-gray-900 text-[9px] flex items-center justify-center text-slate-700 dark:text-white font-bold"
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      {count > 3 && (
        <span className="text-xs text-slate-500 dark:text-slate-400">+{count - 3}</span>
      )}
    </div>
  );
}

interface ReportCardProps {
  report: BlacklistReport;
  idx: number;
  onViewDetails: () => void;
  onConfirm: (id: string) => void;
  confirming: boolean;
  isAuthenticated?: boolean;
}

function ReportCard({ report, idx, onViewDetails, onConfirm, confirming, isAuthenticated }: ReportCardProps) {
  const risk = MOCK_RISKS[idx % MOCK_RISKS.length];
  const tags = MOCK_TAGS[idx % MOCK_TAGS.length];
  const role = MOCK_ROLES[idx % MOCK_ROLES.length];
  const loc = MOCK_LOCATIONS[idx % MOCK_LOCATIONS.length];
  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const confirmed = report.confirmationCount;

  return (
    <div className="bg-white border border-gray-200 dark:bg-[#0d1f17] dark:border-emerald-900/40 rounded-xl p-4 flex flex-col gap-3 hover:border-green-400 dark:hover:border-emerald-700/60 transition-all duration-200 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {getInitials(report.username)}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{report.username}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-slate-700/60 dark:text-slate-300 font-medium border border-gray-200 dark:border-transparent">
                {role}
              </span>
            </div>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-600 border border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 shrink-0">
          SCAMMER
        </span>
      </div>

      <div className="text-[11px] text-slate-500 dark:text-slate-400">
        Reported: {formatDate(report.updatedAt)} • {timeAgo(report.updatedAt)}
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300">
        <MapPin className="w-3 h-3 text-gray-400 dark:text-slate-500" />
        <span>{loc.from}</span>
        <span className="text-gray-400 dark:text-slate-600">→</span>
        <span>{report.region || loc.to}</span>
      </div>

      {report.contactInfo && (
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
          <span>Telegram:</span>
          <span className="text-green-600 dark:text-emerald-400 font-mono">{report.contactInfo}</span>
          <button
            onClick={() => copyToClipboard(report.contactInfo)}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <RiskBadge level={risk} />
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
          <span>Reported by {confirmed} users</span>
          <ConfirmedAvatars count={confirmed} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (<TagBadge key={t} label={t} />))}
      </div>

      {report.description && (
        <blockquote className="text-xs text-gray-500 dark:text-slate-400 italic border-l-2 border-green-500 dark:border-emerald-800 pl-3 line-clamp-2">
          "{report.description}"
        </blockquote>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 mt-auto">
        <button
          onClick={onViewDetails}
          className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-emerald-900/50 dark:text-slate-300 dark:hover:bg-emerald-900/20 transition-colors"
        >
          View Details
        </button>
        {isAuthenticated ? (
          <button
            onClick={() => onConfirm(report.id)}
            disabled={confirming}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-60 ${
              report.confirmedByMe
                ? "bg-green-600 text-white border border-green-600 dark:bg-emerald-600 dark:border-emerald-600"
                : "bg-green-100 border border-green-300 text-green-700 hover:bg-green-200 dark:bg-emerald-700/30 dark:border-emerald-700/50 dark:text-emerald-300 dark:hover:bg-emerald-700/50"
            }`}
          >
            <ThumbsUp className="w-3 h-3" />
            {report.confirmedByMe ? "Confirmed" : "+ Confirm"}
          </button>
        ) : (
          <button
            onClick={onViewDetails}
            className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-green-100 border border-green-300 text-green-700 hover:bg-green-200 dark:bg-emerald-700/30 dark:border-emerald-700/50 dark:text-emerald-300 dark:hover:bg-emerald-700/50 transition-colors flex items-center justify-center gap-1"
          >
            <ThumbsUp className="w-3 h-3" />
            {`${report.confirmationCount} Confirmed`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Report Form ──────────────────────────────────────────────────────────────

function ReportForm({}) {
  const [formData, setFormData] = useState({ username: "", region: "", contactInfo: "", description: "" });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus("idle");
    setFormError("");
    try {
      const data = new FormData();
      data.append("username", formData.username);
      data.append("region", formData.region);
      data.append("contactInfo", formData.contactInfo);
      data.append("description", formData.description);
      if (evidenceFile) {
        if (evidenceFile.size > 10 * 1024 * 1024) throw new Error("File size must be less than 10MB");
        data.append("evidence", evidenceFile);
      }
      await api.upload("/blacklist", data);
      setSubmitStatus("success");
      setFormData({ username: "", region: "", contactInfo: "", description: "" });
      setEvidenceFile(null);
    } catch (error: any) {
      setSubmitStatus("error");
      setFormError(error.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors dark:bg-[#0d1f17] dark:border-emerald-900/50 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-600";

  if (submitStatus === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Report Submitted</h3>
        <p className="text-gray-500 dark:text-slate-400 max-w-xs">
          Thank you for helping keep the community safe. Your report is under review.
        </p>
        <button
          onClick={() => setSubmitStatus("idle")}
          className="mt-2 px-6 py-2.5 rounded-lg border border-green-400 text-green-700 hover:bg-green-50 dark:border-emerald-700/50 dark:text-emerald-300 dark:hover:bg-emerald-900/30 transition-colors text-sm font-medium"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Username *</label>
        <input required placeholder="e.g. Scammer123" value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })} className={inputClass} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Region / Location</label>
          <input placeholder="e.g. New York, USA" value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })} className={inputClass} />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Known Contact Info</label>
          <input placeholder="Phone, Email, or Social Handle" value={formData.contactInfo}
            onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })} className={inputClass} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Description / Details *</label>
        <textarea required placeholder="Describe what happened..." rows={4} value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={`${inputClass} resize-none`} />
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Evidence (Optional, Max 10MB)</label>
        <input type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={(e) => setEvidenceFile(e.target.files ? e.target.files[0] : null)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-500 focus:outline-none focus:border-green-500 transition-colors file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-green-100 file:text-green-700 hover:file:bg-green-200 dark:bg-[#0d1f17] dark:border-emerald-900/50 dark:text-slate-400 dark:focus:border-emerald-600 dark:file:bg-emerald-800/40 dark:file:text-emerald-300 dark:hover:file:bg-emerald-800/60" />
        <p className="text-xs text-gray-400 dark:text-slate-500">Allowed: Images, Videos, PDF, Documents</p>
      </div>
      {submitStatus === "error" && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/30">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{formError || "Failed to submit report. Please try again."}</span>
        </div>
      )}
      <button type="submit" disabled={submitting}
        className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
        <Flag className="w-4 h-4" />
        {submitting ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SafetyPage() {
  const { isAuthenticated } = useAuthStore();
  const searchParams = useSearchParams();

  const [reports, setReports] = useState<BlacklistReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<ReportView>("reports");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<{ report: BlacklistReport; idx: number } | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const PER_PAGE = 6;

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "report") setView("report_user");
  }, [searchParams]);

  const fetchReports = useCallback(async () => {
    try {
      const data = await api.get("/blacklist");
      setReports(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleConfirm = async (id: string) => {
    if (!isAuthenticated || confirmingId) return;
    setConfirmingId(id);
    try {
      const res = await api.post(`/blacklist/${id}/confirm`, {});
      // Update local state
      setReports((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, confirmationCount: res.confirmationCount, confirmedByMe: res.confirmed }
            : r
        )
      );
      // Update modal report if open
      setSelectedReport((prev) =>
        prev && prev.report.id === id
          ? { ...prev, report: { ...prev.report, confirmationCount: res.confirmationCount, confirmedByMe: res.confirmed } }
          : prev
      );
    } catch (e: any) {
      alert(e.message || "Failed to confirm report");
    } finally {
      setConfirmingId(null);
    }
  };

  const filtered = reports.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.username.toLowerCase().includes(q) ||
      (r.contactInfo || "").toLowerCase().includes(q) ||
      (r.region || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalReports = reports.length;
  const highRisk = Math.round(totalReports * 0.29) || 36;
  const resolved = 78;
  const cardClass = "bg-white border border-gray-200 dark:bg-[#0d1f17] dark:border-emerald-900/40 rounded-2xl";

  return (
    <div className="min-h-screen space-y-6">
      {/* Detail Modal */}
      {selectedReport && (
        <DetailModal
          report={selectedReport.report}
          idx={selectedReport.idx}
          onClose={() => setSelectedReport(null)}
          onConfirm={handleConfirm}
          confirming={confirmingId === selectedReport.report.id}
        />
      )}

      {/* ── Page Header ── */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 border border-green-300 dark:bg-emerald-700/30 dark:border-emerald-700/50 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-green-700 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Community Safety &amp; Reports
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
            Check reports, verify vendors, and help keep the community safe.
          </p>
        </div>
      </div>

      {/* ── View Nav Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { id: "reports" as ReportView, icon: <ShieldAlert className="w-5 h-5" />, label: "Reports", sub: "View reported users and vendors" },
          { id: "report_user" as ReportView, icon: <Flag className="w-5 h-5" />, label: "Report a User", sub: "Submit a report to the community" },
          { id: "safe_vendors" as ReportView, icon: <ShieldCheck className="w-5 h-5" />, label: "Verified Safe Vendors", sub: "Browse trusted, community-vetted vendors" },
        ].map((v) => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
              view === v.id
                ? "bg-green-50 border-green-400 dark:bg-emerald-700/30 dark:border-emerald-600/60"
                : "bg-white border-gray-200 hover:border-green-300 dark:bg-[#0d1f17] dark:border-emerald-900/40 dark:hover:border-emerald-800/60"
            }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              view === v.id ? "bg-green-100 text-green-700 dark:bg-emerald-600/40 dark:text-emerald-300" : "bg-gray-100 text-gray-500 dark:bg-slate-800/60 dark:text-slate-500"
            }`}>{v.icon}</div>
            <div>
              <div className={`font-semibold text-sm ${view === v.id ? "text-green-700 dark:text-white" : "text-gray-700 dark:text-slate-400"}`}>{v.label}</div>
              <div className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">{v.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Alert Banner ── */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-green-50 border border-green-300 dark:bg-emerald-900/20 dark:border-emerald-800/40 rounded-xl px-4 py-3 gap-3">
        <div className="flex items-center gap-2 text-sm text-green-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Reports are community-submitted. <span className="font-semibold">Please verify details and use your best judgment.</span></span>
        </div>
        <button className="text-xs text-green-700 hover:text-green-900 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 shrink-0 transition-colors">
          Learn how it works <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {view === "report_user" ? (
        <div className={`${cardClass} p-6`}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-500" /> Report a User
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Submit details about a potential scammer. Your report will be reviewed before being listed.</p>
          </div>
          <ReportForm />
        </div>
      ) : view === "safe_vendors" ? (
        <div className={`${cardClass} p-12 flex flex-col items-center justify-center text-center gap-4`}>
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-emerald-700/20 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-green-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verified Safe Vendors</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm max-w-sm">Community-vetted vendors who have been verified by multiple trusted members. Coming soon.</p>
        </div>
      ) : (
        /* ── Reports List View ── */
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full flex-1 min-w-0 space-y-4">
            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                <input type="text" placeholder="Search by username, telegram, or region..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="w-full bg-white border border-gray-200 dark:bg-[#0d1f17] dark:border-emerald-900/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 dark:focus:border-emerald-600 transition-colors" />
              </div>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 dark:bg-[#0d1f17] dark:border-emerald-900/50 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {([
                { id: "all", label: "All" }, { id: "vendors", label: "Vendors" },
                { id: "users", label: "Users" }, { id: "high_risk", label: "High Risk" },
                { id: "recent", label: "Recent" },
              ] as { id: FilterTab; label: string }[]).map((f) => (
                <button key={f.id} onClick={() => setFilterTab(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    filterTab === f.id
                      ? "bg-green-100 border-green-400 text-green-700 dark:bg-emerald-700/40 dark:border-emerald-600/60 dark:text-emerald-200"
                      : "bg-white border-gray-200 text-gray-500 hover:text-gray-700 dark:bg-[#0d1f17] dark:border-emerald-900/40 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}>
                  {f.label}
                </button>
              ))}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium border bg-white border-gray-200 text-gray-500 hover:text-gray-700 dark:bg-[#0d1f17] dark:border-emerald-900/40 dark:text-slate-400 flex items-center justify-center gap-1">
                  Country <ChevronDown className="w-3 h-3" />
                </button>
                <button className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium border bg-white border-gray-200 text-gray-500 hover:text-gray-700 dark:bg-[#0d1f17] dark:border-emerald-900/40 dark:text-slate-400 flex items-center justify-center gap-1">
                  State/Province <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <div className="sm:ml-auto w-full sm:w-auto">
                <button className="w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-medium border bg-white border-gray-200 text-gray-500 hover:text-gray-700 dark:bg-[#0d1f17] dark:border-emerald-900/40 dark:text-slate-400 flex items-center justify-center gap-1">
                  Sort: Most Reported <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Count + warning */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-slate-400">Showing {filtered.length} report{filtered.length !== 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                <AlertTriangle className="w-3.5 h-3.5" /> High risk items are highlighted
              </span>
            </div>

            {/* Cards */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-xl bg-gray-100 dark:bg-[#0d1f17] border border-gray-200 dark:border-emerald-900/30 animate-pulse" />
                ))}
              </div>
            ) : paged.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <ShieldCheck className="w-10 h-10 text-gray-300 dark:text-emerald-700/60" />
                <p className="text-gray-500 dark:text-slate-400 text-sm">No reports found.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paged.map((report, idx) => {
                  const globalIdx = (page - 1) * PER_PAGE + idx;
                  return (
                    <ReportCard
                      key={report.id}
                      report={report}
                      idx={globalIdx}
                      onViewDetails={() => setSelectedReport({ report, idx: globalIdx })}
                      onConfirm={handleConfirm}
                      confirming={confirmingId === report.id}
                    />
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 pt-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 dark:border-emerald-900/40 text-gray-500 dark:text-slate-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium border transition-all ${
                        page === p
                          ? "bg-green-600 border-green-600 text-white dark:bg-emerald-600 dark:border-emerald-600"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-emerald-900/40 dark:text-slate-400 dark:hover:bg-emerald-900/20"
                      }`}>
                      {p}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-gray-400 dark:text-slate-600 text-xs px-1">...</span>
                    <button onClick={() => setPage(totalPages)}
                      className="w-8 h-8 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 dark:border-emerald-900/40 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-emerald-900/20">
                      {totalPages}
                    </button>
                  </>
                )}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 dark:border-emerald-900/40 text-gray-500 dark:text-slate-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            <div className={`${cardClass} p-5`}>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-green-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Safety at a Glance</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-500 mb-4">Community reports help protect everyone.</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold text-red-500 dark:text-red-400">{totalReports || 124}</div>
                  <div className="text-[10px] text-gray-500 dark:text-slate-500 mt-0.5">Total Reports</div>
                  <div className="text-[10px] text-gray-400 dark:text-slate-600">This month</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{highRisk}</div>
                  <div className="text-[10px] text-gray-500 dark:text-slate-500 mt-0.5">High Risk</div>
                  <div className="text-[10px] text-gray-400 dark:text-slate-600">Require caution</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-emerald-400">{resolved}%</div>
                  <div className="text-[10px] text-gray-500 dark:text-slate-500 mt-0.5">Resolved</div>
                  <div className="text-[10px] text-gray-400 dark:text-slate-600">By community</div>
                </div>
              </div>
            </div>

            <div className={`${cardClass} p-5`}>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-green-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recently Reported</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-500 mb-4">New reports from the past 7 days.</p>
              <div className="space-y-3">
                {RECENTLY_REPORTED.map((u) => (
                  <div key={u.username} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-white">
                        {getInitials(u.username)}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-900 dark:text-white">{u.username}</div>
                        <div className="text-[10px] text-gray-500 dark:text-slate-500">{u.country} • {u.date}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-600 border border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30">SCAMMER</span>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-xs text-green-600 hover:text-green-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors">
                View all recent <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className={`${cardClass} p-5`}>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-green-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Community Guidelines</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-500 mb-4">Let's keep each other safe.</p>
              <ul className="space-y-2.5">
                {GUIDELINES.map((g) => (
                  <li key={g} className="flex items-start gap-2 text-xs text-gray-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 dark:text-emerald-500 shrink-0 mt-0.5" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
              <button className="mt-4 text-xs text-green-600 hover:text-green-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors">
                Read full guidelines <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
