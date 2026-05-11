"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import type { ReferralNote } from "@/types";

interface Props {
  referralId: string;
  notes: ReferralNote[];
}

export default function ReferralNotesPanel({ referralId, notes }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/admin/referrals/${referralId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to add note."); return; }
      setContent(""); router.refresh();
    } catch { setError("Network error."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea rows={3} value={content} onChange={e => setContent(e.target.value)} disabled={busy}
          placeholder="Add a referral note…"
          className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue resize-none" />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" disabled={busy || !content.trim()}
          className="inline-flex items-center gap-2 bg-makati-blue text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {busy ? "Adding…" : "Add Note"}
        </button>
      </form>

      <div className="space-y-3">
        {notes.length === 0 && <p className="text-sm text-gray-400 italic">No notes yet.</p>}
        {notes.map(n => (
          <div key={n.id} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-1">
            <p className="text-xs text-gray-500 dark:text-slate-400">{n.authorName ?? "Staff"} · {new Date(n.createdAt).toLocaleString()}</p>
            <p className="text-sm text-gray-700 dark:text-slate-200 whitespace-pre-wrap">{n.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
