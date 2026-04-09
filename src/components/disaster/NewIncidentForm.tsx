"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, AlertTriangle, X } from "lucide-react";

const DISASTER_TYPES = [
  "TYPHOON", "FIRE", "FLOOD", "EARTHQUAKE", "LANDSLIDE", "OTHER",
] as const;

const BARANGAYS = [
  "Bangkal","Bel-Air","Carmona","Cembo","Comembo","Dasmariñas",
  "East Rembo","Forbes Park","Guadalupe Nuevo","Guadalupe Viejo",
  "Kasilawan","La Paz","Magallanes","Olympia","Palanan","Pembo",
  "Pinagkaisahan","Pio del Pilar","Pitogo","Poblacion",
  "Post Proper Northside","Post Proper Southside","Rizal","San Antonio",
  "San Isidro","San Lorenzo","Santa Cruz","Singkamas","South Cembo",
  "Tejeros","Ugong Norte","Urdaneta","West Rembo",
];

export default function NewIncidentForm() {
  const router  = useRouter();
  const [open,  setOpen]    = useState(false);
  const [busy,  setBusy]    = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const [title,       setTitle]       = useState("");
  const [type,        setType]        = useState<string>("TYPHOON");
  const [description, setDescription] = useState("");
  const [barangay,    setBarangay]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }

    setBusy(true);
    setError(null);

    const res = await fetch("/api/admin/disaster", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ title: title.trim(), type, description: description.trim() || null, barangay: barangay || null }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to create incident.");
      setBusy(false);
      return;
    }

    const data = await res.json();
    router.push(`/admin/disaster/${data.id}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-red-700 active:scale-95 transition-all"
      >
        <Flame className="w-4 h-4" />
        Report Incident
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-gray-100 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Report New Disaster Incident
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Incident Title *
              </label>
              <input
                className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
                placeholder="e.g. Typhoon Odette Response"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={busy}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Disaster Type *
              </label>
              <select
                className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={busy}
              >
                {DISASTER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Primarily Affected Barangay
            </label>
            <select
              className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              disabled={busy}
            >
              <option value="">— All barangays / Unknown —</option>
              {BARANGAYS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Description
            </label>
            <textarea
              className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue resize-none"
              rows={3}
              placeholder="Describe the incident, areas affected, and current situation…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {busy ? "Creating…" : "Create Incident"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
