"use client";

import { useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, ChevronDown } from "lucide-react";
import type { ApplicationStatus, ApprovalLevel, BenefitCategory, RejectionCode, Role, VoterStatus } from "@/types";

const APPROVAL_LEVELS = [
  { label: "MAC Coordinator", key: 0 },
  { label: "MSWD Head",       key: 1 },
  { label: "Mayor's Office",  key: 2 },
] as const;

const REJECTION_CODES: { value: RejectionCode; label: string }[] = [
  { value: "VOTER_INACTIVE",       label: "Inactive voter registration" },
  { value: "INCOMPLETE_DOCS",      label: "Missing or invalid documents" },
  { value: "NOT_ELIGIBLE",         label: "Does not meet eligibility requirements" },
  { value: "ORIENTATION_REQUIRED", label: "Orientation seminar not attended" },
  { value: "FAILED_HOME_VISIT",    label: "Failed home visitation assessment" },
  { value: "OTHER",                label: "Other reason (see remarks)" },
];

interface Props {
  applicationId:        string;
  approvalLevel:        ApprovalLevel;
  status:               ApplicationStatus;
  voterStatus:          VoterStatus;
  orientationAttended:  boolean;
  benefitCategory:      BenefitCategory;
  adminRole:            Role;
}

export default function ApprovalFlow({
  applicationId,
  approvalLevel,
  status,
  voterStatus,
  orientationAttended: initialOrientation,
  benefitCategory,
  adminRole,
}: Props) {
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [success, setSuccess]                 = useState<string | null>(null);
  const [showReturn, setShowReturn]           = useState(false);
  const [rejectionCode, setRejectionCode]     = useState<RejectionCode>("OTHER");
  const [remarks, setRemarks]                 = useState("");
  const [orientationChecked, setOrientation] = useState(initialOrientation);

  const isRejected   = status === "REJECTED";
  const isApproved   = status === "APPROVED" || status === "DISBURSED";
  const isDone       = isRejected || isApproved;

  // Which level this admin can act on
  const canActAtLevel =
    adminRole === "ADMIN"       ? 0 :
    adminRole === "SUPER_ADMIN" ? approvalLevel : -1;

  const canApprove =
    !isDone &&
    canActAtLevel === approvalLevel &&
    voterStatus === "ACTIVE";

  const canReturn = !isDone && canActAtLevel === approvalLevel;

  async function handleAction(action: "approve" | "return") {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "return") {
        body.rejectionCode = rejectionCode;
        body.remarks       = remarks || undefined;
      }
      if (action === "approve" && benefitCategory === "SENIOR_CITIZEN" && approvalLevel === 0) {
        body.orientationAttended = orientationChecked;
      }

      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
      } else {
        setSuccess(
          action === "approve"
            ? "Application advanced to the next approval level."
            : "Application has been returned/rejected."
        );
        setShowReturn(false);
        // Reload the page to reflect new state
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Approval progress ──────────────────────────────────────── */}
      <div className="flex items-center gap-0">
        {APPROVAL_LEVELS.map((lvl, i) => {
          const done    = isApproved ? true : approvalLevel > lvl.key;
          const active  = !isRejected && !isApproved && approvalLevel === lvl.key;
          const pending = !done && !active;

          return (
            <div key={lvl.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors
                  ${isRejected && active
                    ? "bg-red-100 border-red-400 text-red-600"
                    : done
                    ? "bg-makati-blue border-makati-blue text-white"
                    : active
                    ? "bg-white border-makati-blue text-makati-blue"
                    : "bg-gray-100 border-gray-200 text-gray-300"}`}
                >
                  {isRejected && active
                    ? <AlertTriangle className="w-4 h-4" />
                    : done
                    ? <CheckCircle2 className="w-4 h-4" />
                    : <Clock className="w-4 h-4" />
                  }
                </div>
                <span className={`text-[10px] font-semibold text-center leading-tight w-16
                  ${done || active ? "text-makati-blue" : "text-gray-400"}`}
                >
                  {lvl.label}
                </span>
              </div>
              {i < APPROVAL_LEVELS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-5 ${done ? "bg-makati-blue" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Status ────────────────────────────────────────────────── */}
      {isApproved && (
        <p className="text-sm text-green-700 font-semibold bg-green-50 rounded-lg px-3 py-2">
          ✓ Application fully approved by the Mayor&apos;s Office.
        </p>
      )}
      {isRejected && (
        <p className="text-sm text-red-700 font-semibold bg-red-50 rounded-lg px-3 py-2">
          ✗ Application was returned/rejected at level {approvalLevel}.
        </p>
      )}

      {/* ── Voter status warning ───────────────────────────────────── */}
      {!isDone && voterStatus !== "ACTIVE" && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <span>Voter status is <strong>{voterStatus}</strong>. Application cannot be approved until voter status is set to <strong>ACTIVE</strong>.</span>
        </div>
      )}

      {/* ── Orientation checkbox (Senior Citizen / Blue Card only) ── */}
      {!isDone && benefitCategory === "SENIOR_CITIZEN" && approvalLevel === 0 && (
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={orientationChecked}
            onChange={(e) => setOrientation(e.target.checked)}
            className="w-4 h-4 accent-makati-blue"
          />
          <span className="text-gray-700">
            Applicant has attended the required <strong>Orientation Seminar</strong>
          </span>
        </label>
      )}

      {/* ── Action buttons ─────────────────────────────────────────── */}
      {!isDone && canActAtLevel === approvalLevel && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleAction("approve")}
            disabled={!canApprove || loading}
            title={voterStatus !== "ACTIVE" ? "Set voter status to ACTIVE first" : undefined}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing…" : approvalLevel < 2 ? "Approve & Forward" : "Final Approve"}
          </button>

          {canReturn && !showReturn && (
            <button
              onClick={() => setShowReturn(true)}
              disabled={loading}
              className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50"
            >
              Return / Reject
            </button>
          )}
        </div>
      )}

      {/* ── Return form ────────────────────────────────────────────── */}
      {showReturn && (
        <div className="border border-red-100 rounded-lg p-4 space-y-3 bg-red-50">
          <p className="text-sm font-semibold text-red-800">Return / Reject Application</p>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Rejection Reason</label>
            <div className="relative">
              <select
                value={rejectionCode}
                onChange={(e) => setRejectionCode(e.target.value as RejectionCode)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm appearance-none bg-white pr-8"
              >
                {REJECTION_CODES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Additional Remarks (optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Add any specific notes for the applicant…"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleAction("return")}
              disabled={loading}
              className="btn-primary bg-red-600 hover:bg-red-700 text-sm disabled:opacity-50"
            >
              {loading ? "Processing…" : "Confirm Return"}
            </button>
            <button
              onClick={() => setShowReturn(false)}
              disabled={loading}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Feedback messages ──────────────────────────────────────── */}
      {error   && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{success}</p>}
    </div>
  );
}
