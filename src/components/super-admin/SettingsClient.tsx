"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ToggleLeft,
  ToggleRight,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Package,
} from "lucide-react";

type Program = {
  id: string;
  name: string;
  category: string;
  description: string;
  isActive: boolean;
  maxAmount?: number | null;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  isActive: boolean;
  createdAt: string;
};

export default function SettingsClient({
  programs,
  announcements,
}: {
  programs: Program[];
  announcements: Announcement[];
}) {
  const router = useRouter();
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
  });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  async function toggleProgram(programId: string, currentActive: boolean) {
    setToggleLoading(programId);
    setError(null);
    try {
      const res = await fetch(`/api/super-admin/programs/${programId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update program.");
        return;
      }
      setSuccess(
        `Program ${currentActive ? "deactivated" : "activated"} successfully.`
      );
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setToggleLoading(null);
    }
  }

  async function toggleAnnouncement(id: string, currentActive: boolean) {
    setToggleLoading(`ann-${id}`);
    setError(null);
    try {
      const res = await fetch(`/api/super-admin/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update announcement.");
        return;
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setToggleLoading(null);
    }
  }

  async function createAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setSavingAnnouncement(true);
    setError(null);
    try {
      const res = await fetch("/api/super-admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...announcementForm, isActive: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create announcement.");
        return;
      }
      setSuccess("Announcement published successfully.");
      setAnnouncementForm({ title: "", body: "" });
      setShowAnnouncementForm(false);
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSavingAnnouncement(false);
    }
  }

  const CATEGORY_LABELS: Record<string, string> = {
    FINANCIAL_ASSISTANCE: "Financial Assistance",
    MEDICAL_ASSISTANCE: "Medical Assistance",
    SENIOR_CITIZEN: "Senior Citizen",
    PWD_ASSISTANCE: "PWD Assistance",
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Benefit Programs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-makati-blue" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Benefit Programs
          </h2>
        </div>
        <div className="card divide-y divide-gray-100 dark:divide-slate-700 overflow-hidden">
          {programs.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400 dark:text-slate-500">
              No benefit programs found.
            </p>
          ) : (
            programs.map((prog) => (
              <div
                key={prog.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {prog.name}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {CATEGORY_LABELS[prog.category] ?? prog.category}
                    </span>
                    {prog.maxAmount && (
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        Max: {"\u20B1"}
                        {prog.maxAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">
                    {prog.description}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs font-semibold ${
                      prog.isActive
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-400 dark:text-slate-500"
                    }`}
                  >
                    {prog.isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => toggleProgram(prog.id, prog.isActive)}
                    disabled={toggleLoading === prog.id}
                    className="text-gray-400 hover:text-makati-blue disabled:opacity-50 transition-colors"
                    title={prog.isActive ? "Deactivate" : "Activate"}
                  >
                    {prog.isActive ? (
                      <ToggleRight className="w-7 h-7 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Announcements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-makati-blue" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Announcements
            </h2>
          </div>
          <button
            onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        </div>

        {/* New Announcement Form */}
        {showAnnouncementForm && (
          <div className="card p-6 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
              Publish New Announcement
            </h3>
            <form onSubmit={createAnnouncement} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="Announcement title..."
                  className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={announcementForm.body}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      body: e.target.value,
                    })
                  }
                  placeholder="Announcement content..."
                  className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={savingAnnouncement}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {savingAnnouncement ? "Publishing..." : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnnouncementForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card divide-y divide-gray-100 dark:divide-slate-700 overflow-hidden">
          {announcements.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400 dark:text-slate-500">
              No announcements yet.
            </p>
          ) : (
            announcements.map((ann) => (
              <div key={ann.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {ann.title}
                      </p>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          ann.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400"
                        }`}
                      >
                        {ann.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2">
                      {ann.body}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      {new Date(ann.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleAnnouncement(ann.id, ann.isActive)}
                    disabled={toggleLoading === `ann-${ann.id}`}
                    className="text-gray-400 hover:text-makati-blue disabled:opacity-50 transition-colors shrink-0"
                  >
                    {ann.isActive ? (
                      <ToggleRight className="w-7 h-7 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
