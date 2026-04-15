"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, X } from "lucide-react";
import type { ApplicationStatus } from "@/types";
import { formatDate } from "@/lib/utils";

interface Issuance {
  id:           string;
  bookletType:  "MEDICINE" | "GROCERY" | "MOVIE";
  bookletNumber: string | null;
  claimDate:    string | null;
  signatureUrl: string | null;
  createdAt:    string;
}

interface Props {
  applicationId: string;
  status:        ApplicationStatus;
}

const BOOKLET_LABELS: Record<string, string> = {
  MEDICINE: "Medicine Booklet",
  GROCERY:  "Grocery Booklet",
  MOVIE:    "Movie Booklet",
};

const BOOKLET_COLORS: Record<string, string> = {
  MEDICINE: "bg-blue-100 text-blue-700",
  GROCERY:  "bg-green-100 text-green-700",
  MOVIE:    "bg-purple-100 text-purple-700",
};

export default function IdIssuancePanel({ applicationId, status }: Props) {
  const [issuances, setIssuances] = useState<Issuance[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const [bookletType,   setBookletType]   = useState<"MEDICINE" | "GROCERY" | "MOVIE">("MEDICINE");
  const [bookletNumber, setBookletNumber] = useState("");
  const [claimDate,     setClaimDate]     = useState("");

  const eligible = status === "APPROVED" || status === "DISBURSED";

  useEffect(() => {
    if (!eligible) return;
    fetch(`/api/admin/applications/${applicationId}/id-issuance`)
      .then((r) => r.json())
      .then((data) => setIssuances(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [applicationId, eligible]);

  if (!eligible) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/id-issuance`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          bookletType,
          bookletNumber: bookletNumber || undefined,
          claimDate:     claimDate     || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to record issuance.");
      } else {
        setIssuances((prev) => [json, ...prev]);
        setShowForm(false);
        setBookletNumber("");
        setClaimDate("");
        setBookletType("MEDICINE");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-makati-blue" />
          ID / Booklet Issuance
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-makati-blue text-white hover:bg-blue-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Record Issuance
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-slate-700/30">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">New Issuance Record</p>
            <button type="button" onClick={() => { setShowForm(false); setError(null); }}
              className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Booklet Type</label>
              <select
                value={bookletType}
                onChange={(e) => setBookletType(e.target.value as typeof bookletType)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              >
                <option value="MEDICINE">Medicine Booklet</option>
                <option value="GROCERY">Grocery Booklet</option>
                <option value="MOVIE">Movie Booklet</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Booklet / Serial No.</label>
              <input
                type="text"
                value={bookletNumber}
                onChange={(e) => setBookletNumber(e.target.value)}
                placeholder="e.g. MED-2026-00123"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Claim Date</label>
              <input
                type="date"
                value={claimDate}
                onChange={(e) => setClaimDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="btn-primary text-sm disabled:opacity-50">
              {loading ? "Saving…" : "Save Record"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(null); }}
              disabled={loading}
              className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Issuance list */}
      {issuances.length === 0 && !showForm ? (
        <p className="text-xs text-gray-400 dark:text-slate-500 italic">No booklets recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {issuances.map((item) => (
            <div key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BOOKLET_COLORS[item.bookletType] ?? ""}`}>
                  {BOOKLET_LABELS[item.bookletType] ?? item.bookletType}
                </span>
                {item.bookletNumber && (
                  <span className="text-xs font-mono text-gray-600 dark:text-slate-300">{item.bookletNumber}</span>
                )}
              </div>
              <div className="text-right">
                {item.claimDate && (
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Claimed {formatDate(item.claimDate)}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Recorded {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
