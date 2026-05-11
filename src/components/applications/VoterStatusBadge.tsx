"use client";

import { useState } from "react";
import { Pencil, ChevronDown, Check, X } from "lucide-react";
import type { Role, VoterStatus } from "@/types";

interface Props {
  applicationId: string;
  currentStatus: VoterStatus;
  adminRole:     Role;
}

const VOTER_STATUS_OPTIONS: { value: VoterStatus; label: string }[] = [
  { value: "ACTIVE",   label: "Active"         },
  { value: "INACTIVE", label: "Inactive"       },
  { value: "UNKNOWN",  label: "Not yet verified" },
];

const BADGE_STYLES: Record<VoterStatus, string> = {
  ACTIVE:   "bg-green-100 text-green-700",
  INACTIVE: "bg-red-100 text-red-700",
  UNKNOWN:  "bg-gray-100 text-gray-500",
};

export default function VoterStatusBadge({ applicationId, currentStatus, adminRole }: Props) {
  const [status,  setStatus]  = useState<VoterStatus>(currentStatus);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<VoterStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/applications/${applicationId}/voter-status`,
        {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ voterStatus: pending }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to update.");
      } else {
        setStatus(pending);
        setEditing(false);
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE_STYLES[status]}`}>
          Voter: {VOTER_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status}
        </span>
        {(adminRole === "ADMIN" || adminRole === "SUPER_ADMIN") && (
          <button
            onClick={() => { setPending(status); setEditing(true); setError(null); }}
            className="text-gray-400 hover:text-makati-blue transition-colors"
            title="Update voter status"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <select
          value={pending}
          onChange={(e) => setPending(e.target.value as VoterStatus)}
          disabled={loading}
          className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs appearance-none bg-white pr-7 disabled:opacity-60"
        >
          {VOTER_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1.5 text-gray-400 pointer-events-none" />
      </div>
      <button
        onClick={save}
        disabled={loading}
        className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => { setEditing(false); setError(null); }}
        disabled={loading}
        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
