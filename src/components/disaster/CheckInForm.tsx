"use client";
import { useState } from "react";
import { CheckCircle, AlertCircle, UserPlus } from "lucide-react";

const BARANGAYS = [
  "Bangkal","Bel-Air","Carmona","Dasmariñas","Forbes Park",
  "Guadalupe Nuevo","Guadalupe Viejo","Kasilawan","La Paz","Magallanes",
  "Olympia","Palanan","Pinagkaisahan","Pio del Pilar","Poblacion",
  "San Antonio","San Isidro","San Lorenzo","Santa Cruz","Singkamas",
  "Tejeros","Urdaneta","Valenzuela",
];

export function CheckInForm({ centerId }: { centerId: string }) {
  const [name, setName]           = useState("");
  const [age, setAge]             = useState("");
  const [barangay, setBarangay]   = useState("");
  const [headCount, setHeadCount] = useState("1");
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [lastName, setLastName]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Full name is required."); return; }

    setBusy(true);
    try {
      const res = await fetch("/api/public/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId, name: name.trim(), age: age || null, barangay: barangay || null, headCount: Number(headCount) || 1 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Check-in failed."); return; }

      setLastName(name.trim());
      setCheckedIn(true);
      setName(""); setAge(""); setBarangay(""); setHeadCount("1");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {checkedIn && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800 text-sm">Checked in successfully!</p>
            <p className="text-xs text-green-700 mt-0.5">{lastName} has been registered.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
            placeholder="Enter full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            autoComplete="name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
            <input
              type="number" min="0" max="120"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              disabled={busy}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Family Members</label>
            <input
              type="number" min="1"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
              placeholder="1"
              value={headCount}
              onChange={(e) => setHeadCount(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Home Barangay</label>
          <select
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            disabled={busy}
          >
            <option value="">— Select barangay —</option>
            {BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 bg-makati-blue text-white font-semibold py-3 rounded-xl hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-50 text-sm"
        >
          <UserPlus className="w-4 h-4" />
          {busy ? "Checking in…" : "Check In"}
        </button>
      </form>
    </div>
  );
}
