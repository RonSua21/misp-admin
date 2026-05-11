"use client";
import { useState, useEffect, useCallback } from "react";
import { Megaphone, AlertTriangle, Send, CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";

// Note: metadata export is not supported in client components.
// To set the page title, use a server wrapper or <title> tag — this page is client for the live form.

type NotificationType = "ANNOUNCEMENT" | "DISASTER_ALERT";

interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
}

const TYPE_OPTIONS: { value: NotificationType; label: string; desc: string; color: string }[] = [
  {
    value: "ANNOUNCEMENT",
    label: "General Announcement",
    desc: "News, updates, service advisories",
    color: "border-green-500 bg-green-50 text-green-700",
  },
  {
    value: "DISASTER_ALERT",
    label: "Disaster Alert",
    desc: "Typhoon warnings, evacuation orders, emergencies",
    color: "border-red-500 bg-red-50 text-red-700",
  },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function AnnouncementsPage() {
  const [title,   setTitle]   = useState("");
  const [message, setMessage] = useState("");
  const [type,    setType]    = useState<NotificationType>("ANNOUNCEMENT");
  const [busy,    setBusy]    = useState(false);
  const [success, setSuccess] = useState<{ sentTo: number } | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [history, setHistory] = useState<Broadcast[]>([]);

  const fetchHistory = useCallback(async () => {
    const res = await fetch("/api/admin/announcements");
    if (res.ok) {
      const data = await res.json();
      setHistory(data.broadcasts ?? []);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), message: message.trim(), type }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to send announcement.");
    } else {
      setSuccess({ sentTo: data.sentTo });
      setTitle("");
      setMessage("");
      fetchHistory();
    }

    setBusy(false);
  }

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-makati-blue" />
          Announcements
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Broadcast notifications to all registered residents instantly.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Compose form ───────────────────────────────── */}
        <section className="card dark:bg-slate-900 dark:border-slate-700 p-6 space-y-5">
          <h2 className="font-bold text-gray-900 dark:text-white text-sm">Send Notification</h2>

          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3">
            {TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`cursor-pointer border-2 rounded-xl p-3 transition-all ${
                  type === opt.value
                    ? opt.color
                    : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={opt.value}
                  checked={type === opt.value}
                  onChange={() => setType(opt.value)}
                  className="sr-only"
                />
                <p className="font-semibold text-xs">{opt.label}</p>
                <p className="text-[11px] mt-0.5 opacity-80">{opt.desc}</p>
              </label>
            ))}
          </div>

          {type === "DISASTER_ALERT" && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">
                Disaster alerts are high-priority. Use only for genuine emergencies or official NDRRMC-aligned warnings.
              </p>
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Title *
              </label>
              <input
                className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
                placeholder='e.g. "Typhoon Carina — Evacuation Advisory"'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={busy}
                maxLength={120}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Message *
              </label>
              <textarea
                className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue resize-none"
                rows={4}
                placeholder="Write the full message to be sent to all residents..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={busy}
                maxLength={500}
                required
              />
              <p className="text-right text-xs text-gray-400 mt-0.5">{message.length}/500</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {success && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  Sent to <strong>{success.sentTo}</strong> resident{success.sentTo !== 1 ? "s" : ""}.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !title.trim() || !message.trim()}
              className="w-full inline-flex items-center justify-center gap-2 bg-makati-blue text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              {busy ? "Sending…" : "Send to All Residents"}
            </button>
          </form>
        </section>

        {/* ── Broadcast history ──────────────────────────── */}
        <section className="card dark:bg-slate-900 dark:border-slate-700 p-6 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white text-sm">Recent Broadcasts</h2>

          {history.length === 0 ? (
            <div className="py-12 text-center">
              <Megaphone className="w-8 h-8 text-gray-200 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-slate-500">No broadcasts sent yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-xl p-3 border ${
                    b.type === "DISASTER_ALERT"
                      ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/40"
                      : "bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      {b.type === "DISASTER_ALERT" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      ) : (
                        <Megaphone className="w-3.5 h-3.5 text-makati-blue shrink-0" />
                      )}
                      <span className={`text-[10px] font-bold uppercase ${
                        b.type === "DISASTER_ALERT" ? "text-red-600 dark:text-red-400" : "text-makati-blue"
                      }`}>
                        {b.type === "DISASTER_ALERT" ? "Disaster Alert" : "Announcement"}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500 shrink-0">
                      <Clock className="w-3 h-3" />
                      {timeAgo(b.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{b.title}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{b.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
