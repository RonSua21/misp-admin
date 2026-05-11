"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2 } from "lucide-react";
import type { CaseNote, CaseNoteType } from "@/types";

const NOTE_COLORS: Record<CaseNoteType, string> = {
  FIELD_VISIT:      "bg-blue-100 text-blue-800",
  OFFICE_INTERVIEW: "bg-purple-100 text-purple-800",
  PHONE:            "bg-green-100 text-green-800",
  UPDATE:           "bg-gray-100 text-gray-700",
};

interface Props {
  caseId: string;
  notes: CaseNote[];
}

export default function CaseNotesTimeline({ caseId, notes }: Props) {
  const router = useRouter();
  const [content, setContent]   = useState("");
  const [type, setType]         = useState<CaseNoteType>("UPDATE");
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to add note."); return; }
      setContent(""); router.refresh();
    } catch { setError("Network error."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <select value={type} onChange={e => setType(e.target.value as CaseNoteType)} disabled={busy}
            className="border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue">
            <option value="UPDATE">Update</option>
            <option value="FIELD_VISIT">Field Visit</option>
            <option value="OFFICE_INTERVIEW">Office Interview</option>
            <option value="PHONE">Phone Call</option>
          </select>
        </div>
        <textarea
          className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue resize-none"
          rows={3}
          placeholder="Add a case note…"
          value={content}
          onChange={e => setContent(e.target.value)}
          disabled={busy}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" disabled={busy || !content.trim()}
          className="inline-flex items-center gap-2 bg-makati-blue text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
          {busy ? "Adding…" : "Add Note"}
        </button>
      </form>

      {/* Timeline */}
      <div className="space-y-3">
        {notes.length === 0 && (
          <p className="text-sm text-gray-400 italic">No notes yet.</p>
        )}
        {notes.map(n => (
          <div key={n.id} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${NOTE_COLORS[n.type]}`}>
                {n.type.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {n.authorName ?? "Staff"} · {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-slate-200 whitespace-pre-wrap">{n.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
