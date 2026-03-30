"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Package } from "lucide-react";

const BARANGAYS = [
  "Bangkal", "Bel-Air", "Carmona", "Dasmariñas", "Forbes Park",
  "Guadalupe Nuevo", "Guadalupe Viejo", "Kasilawan", "La Paz",
  "Magallanes", "Olympia", "Palanan", "Pinagkaisahan", "Pio del Pilar",
  "Poblacion", "San Antonio", "San Isidro", "San Lorenzo", "Santa Cruz",
  "Singkamas", "Tejeros", "Urdaneta", "Valenzuela",
];

// ── Add Center Form ──────────────────────────────────────────────────────────

export function AddCenterForm({ incidentId }: { incidentId: string }) {
  const router  = useRouter();
  const [open,  setOpen]  = useState(false);
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name,          setName]          = useState("");
  const [address,       setAddress]       = useState("");
  const [barangay,      setBarangay]      = useState("");
  const [capacity,      setCapacity]      = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !address || !barangay || !capacity) {
      setError("Name, address, barangay and capacity are required.");
      return;
    }
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/admin/disaster/${incidentId}/centers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, address, barangay, capacity: Number(capacity), contactPerson: contactPerson || null, contactNumber: contactNumber || null }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed.");
      setBusy(false);
      return;
    }
    router.refresh();
    setOpen(false);
    setName(""); setAddress(""); setBarangay(""); setCapacity("");
    setContactPerson(""); setContactNumber("");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-makati-blue text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Center
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
      <p className="text-sm font-semibold text-gray-700 dark:text-white">Add Evacuation Center</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" placeholder="Center name *" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
          <input className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" placeholder="Street address *" value={address} onChange={(e) => setAddress(e.target.value)} disabled={busy} />
          <select className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" value={barangay} onChange={(e) => setBarangay(e.target.value)} disabled={busy}>
            <option value="">— Barangay *</option>
            {BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <input className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" type="number" min="1" placeholder="Capacity *" value={capacity} onChange={(e) => setCapacity(e.target.value)} disabled={busy} />
          <input className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" placeholder="Contact person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} disabled={busy} />
          <input className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" placeholder="Contact number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} disabled={busy} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="bg-makati-blue text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-800 disabled:opacity-50">{busy ? "Saving…" : "Save Center"}</button>
          <button type="button" onClick={() => setOpen(false)} disabled={busy} className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600">Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ── Register Evacuee Form ────────────────────────────────────────────────────

export function AddEvacueeForm({
  incidentId,
  centers,
}: {
  incidentId: string;
  centers: { id: string; name: string }[];
}) {
  const router  = useRouter();
  const [open,  setOpen]  = useState(false);
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [centerId,  setCenterId]  = useState(centers[0]?.id ?? "");
  const [name,      setName]      = useState("");
  const [age,       setAge]       = useState("");
  const [barangay,  setBarangay]  = useState("");
  const [headCount, setHeadCount] = useState("1");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!centerId || !name) { setError("Center and name are required."); return; }
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/admin/disaster/${incidentId}/evacuees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evacuationCenterId: centerId, name, age: age ? Number(age) : null, barangay: barangay || null, headCount: Number(headCount) }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed.");
      setBusy(false);
      return;
    }
    router.refresh();
    setOpen(false);
    setName(""); setAge(""); setBarangay(""); setHeadCount("1");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
      >
        <Users className="w-3.5 h-3.5" /> Register Evacuee
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
      <p className="text-sm font-semibold text-gray-700 dark:text-white">Register Evacuee</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <select className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" value={centerId} onChange={(e) => setCenterId(e.target.value)} disabled={busy}>
            {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
          <input className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" type="number" min="0" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} disabled={busy} />
          <select className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" value={barangay} onChange={(e) => setBarangay(e.target.value)} disabled={busy}>
            <option value="">— Home barangay —</option>
            {BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <input className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" type="number" min="1" placeholder="Family members (headcount)" value={headCount} onChange={(e) => setHeadCount(e.target.value)} disabled={busy} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="bg-amber-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-amber-600 disabled:opacity-50">{busy ? "Saving…" : "Register"}</button>
          <button type="button" onClick={() => setOpen(false)} disabled={busy} className="text-xs text-gray-500 dark:text-slate-400 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600">Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ── Add Relief Item Form ─────────────────────────────────────────────────────

export function AddInventoryForm({ incidentId }: { incidentId: string }) {
  const router  = useRouter();
  const [open,  setOpen]  = useState(false);
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [itemName,           setItemName]           = useState("");
  const [unit,               setUnit]               = useState("packs");
  const [quantityAvailable,  setQuantityAvailable]  = useState("");
  const [barangay,           setBarangay]           = useState("");
  const [notes,              setNotes]              = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName || !unit || !quantityAvailable) { setError("Item name, unit, and quantity are required."); return; }
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/admin/disaster/${incidentId}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemName, unit, quantityAvailable: Number(quantityAvailable), barangay: barangay || null, notes: notes || null }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed.");
      setBusy(false);
      return;
    }
    router.refresh();
    setOpen(false);
    setItemName(""); setUnit("packs"); setQuantityAvailable(""); setBarangay(""); setNotes("");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
      >
        <Package className="w-3.5 h-3.5" /> Add Relief Item
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
      <p className="text-sm font-semibold text-gray-700 dark:text-white">Add Relief Item</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" placeholder="Item name *" value={itemName} onChange={(e) => setItemName(e.target.value)} disabled={busy} />
          <input className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" placeholder="Unit (packs, kg, boxes…) *" value={unit} onChange={(e) => setUnit(e.target.value)} disabled={busy} />
          <input className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" type="number" min="0" placeholder="Quantity available *" value={quantityAvailable} onChange={(e) => setQuantityAvailable(e.target.value)} disabled={busy} />
          <select className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full" value={barangay} onChange={(e) => setBarangay(e.target.value)} disabled={busy}>
            <option value="">— Target barangay (optional) —</option>
            {BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <input className="border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm w-full col-span-2" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={busy} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="bg-green-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50">{busy ? "Saving…" : "Add Item"}</button>
          <button type="button" onClick={() => setOpen(false)} disabled={busy} className="text-xs text-gray-500 dark:text-slate-400 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600">Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ── Status Update Button ─────────────────────────────────────────────────────

export function StatusUpdateButton({
  incidentId,
  currentStatus,
}: {
  incidentId: string;
  currentStatus: string;
}) {
  const router  = useRouter();
  const [busy,  setBusy]  = useState(false);

  const NEXT: Record<string, { label: string; status: string; color: string }> = {
    ACTIVE:     { label: "Mark Monitoring", status: "MONITORING", color: "bg-amber-500 hover:bg-amber-600" },
    MONITORING: { label: "Mark Resolved",   status: "RESOLVED",   color: "bg-green-600 hover:bg-green-700" },
  };

  const next = NEXT[currentStatus];
  if (!next) return null;

  async function handleClick() {
    setBusy(true);
    await fetch(`/api/admin/disaster/${incidentId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: next.status }),
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors ${next.color}`}
    >
      {busy ? "Updating…" : next.label}
    </button>
  );
}
