"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, UserPlus, ChevronRight, ChevronLeft, Check, Loader2,
  Upload, X, User, FileText, Stethoscope, HandHeart, Flame,
  GraduationCap, UserCheck, Accessibility, Star,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type ApplicationType = "PWD_ID" | "SENIOR_WHITE_CARD" | "SENIOR_BLUE_CARD" | "AICS" | "CALAMITY_RELIEF";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  barangay?: string;
  voterStatus?: string;
  tenurialStatus?: string;
  isSenior?: boolean;
  isPwd?: boolean;
}

interface UploadedDoc { label: string; fileUrl: string; fileType: string; }

interface DemoForm {
  firstName: string; lastName: string; middleName: string;
  email: string; phone: string;
  dateOfBirth: string; sex: string; civilStatus: string;
  barangay: string; address: string;
  voterStatus: string; tenurialStatus: string; yearsInMakati: string;
  isSenior: boolean; isPwd: boolean; isSoloParent: boolean; isPregnant: boolean; isIndigent: boolean;
  prpwdNumber: string; nrscNumber: string;
  disabilityType: string; disabilityCause: string;
  cardType: string; isBedridden: boolean;
}

interface AppDetailsForm {
  applicantBarangay: string; voterStatus: string; tenurialStatus: string;
  aicsCategory: string; amountRequested: string;
  disasterIncidentId: string;
  prpwdEncoded: boolean; homeDeliveryRequired: boolean; homeDeliveryAddress: string;
  orientationAttended: boolean;
  notes: string;
}

const BARANGAYS = [
  "Bangkal","Bel-Air","Carmona","Dasmariñas","Forbes Park",
  "Guadalupe Nuevo","Guadalupe Viejo","Kasilawan","La Paz","Magallanes",
  "Olympia","Palanan","Pinagkaisahan","Pio del Pilar","Poblacion",
  "San Antonio","San Isidro","San Lorenzo","Santa Cruz","Singkamas",
  "Tejeros","Urdaneta","Valenzuela",
];

const REQUIRED_DOCS: Record<ApplicationType, string[]> = {
  PWD_ID:            ["Medical Certificate (Doctor-Validated)", "Valid Government ID", "2x2 Photo", "Barangay Certificate"],
  SENIOR_WHITE_CARD: ["PSA Birth Certificate", "Proof of Barangay Residency", "2x2 Photo"],
  SENIOR_BLUE_CARD:  ["PSA Birth Certificate", "Voter's ID / COMELEC Certification", "Proof of Barangay Residency", "Tenurial Certificate", "2x2 Photo"],
  AICS:              ["Barangay Certificate of Indigency", "Medical Records (if medical assistance)", "Valid Government ID"],
  CALAMITY_RELIEF:   ["Barangay Certificate", "Proof of Residency / Tenurial Status"],
};

const APP_TYPES: { type: ApplicationType; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { type: "PWD_ID",            label: "PWD ID",             description: "Philippine Registry for Persons with Disability ID issuance",          icon: Accessibility,  color: "border-blue-500 bg-blue-50 text-blue-700" },
  { type: "SENIOR_WHITE_CARD", label: "Senior White Card",  description: "Basic senior citizen card — age & barangay residency verified",        icon: Star,           color: "border-gray-400 bg-gray-50 text-gray-700" },
  { type: "SENIOR_BLUE_CARD",  label: "Senior Blue Card",   description: "Premium senior card — strict intake, voter status & tenurial required", icon: UserCheck,      color: "border-indigo-500 bg-indigo-50 text-indigo-700" },
  { type: "AICS",              label: "AICS",               description: "Assistance to Individuals in Crisis Situation — SCSR required",         icon: HandHeart,      color: "border-green-500 bg-green-50 text-green-700" },
  { type: "CALAMITY_RELIEF",   label: "Calamity Relief",    description: "Disaster assistance — DAFAC registration & tenurial bracket",           icon: Flame,          color: "border-red-500 bg-red-50 text-red-700" },
];

const AICS_CATEGORIES = ["MEDICAL", "BURIAL", "EDUCATIONAL", "FOOD", "LIVELIHOOD", "OTHER"];

// ── Field helpers ─────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue";
const selectCls = inputCls;

function SelectInput({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className={selectCls}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

const STEPS = ["Find Resident", "Resident Profile", "Application Type", "Details", "Documents"];

export default function IntakeWizard({ activeIncidents }: {
  activeIncidents: { id: string; title: string; type: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Resident[]>([]);
  const [searching, setSearching] = useState(false);
  const [resident, setResident] = useState<Resident | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Step 2
  const emptyDemo = (): DemoForm => ({
    firstName: "", lastName: "", middleName: "", email: "", phone: "",
    dateOfBirth: "", sex: "", civilStatus: "",
    barangay: "", address: "",
    voterStatus: "UNKNOWN", tenurialStatus: "", yearsInMakati: "",
    isSenior: false, isPwd: false, isSoloParent: false, isPregnant: false, isIndigent: false,
    prpwdNumber: "", nrscNumber: "",
    disabilityType: "", disabilityCause: "",
    cardType: "", isBedridden: false,
  });
  const [demo, setDemo] = useState<DemoForm>(emptyDemo());
  const setDemoField = (k: keyof DemoForm, v: any) => setDemo(prev => ({ ...prev, [k]: v }));

  // Step 3
  const [appType, setAppType] = useState<ApplicationType | null>(null);

  // Step 4
  const emptyDetails = (): AppDetailsForm => ({
    applicantBarangay: "", voterStatus: "UNKNOWN", tenurialStatus: "",
    aicsCategory: "", amountRequested: "",
    disasterIncidentId: "",
    prpwdEncoded: false, homeDeliveryRequired: false, homeDeliveryAddress: "",
    orientationAttended: false,
    notes: "",
  });
  const [details, setDetails] = useState<AppDetailsForm>(emptyDetails());
  const setDetailField = (k: keyof AppDetailsForm, v: any) => setDetails(prev => ({ ...prev, [k]: v }));

  // Step 5
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentLabel, setCurrentLabel] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const err = (msg: string) => { setError(msg); setBusy(false); };

  async function searchResidents() {
    if (query.trim().length < 2) return;
    setSearching(true); setResults([]);
    const res = await fetch(`/api/admin/residents?q=${encodeURIComponent(query)}`);
    setResults(res.ok ? await res.json() : []);
    setSearching(false);
  }

  function pickResident(r: Resident) {
    setResident(r); setIsNew(false);
    setDetails(prev => ({
      ...prev,
      applicantBarangay: r.barangay ?? "",
      voterStatus: r.voterStatus ?? "UNKNOWN",
      tenurialStatus: r.tenurialStatus ?? "",
    }));
    setStep(3);
  }

  function startNew() {
    setResident(null); setIsNew(true);
    setDemo(emptyDemo()); setStep(2);
  }

  async function saveResident() {
    if (!demo.firstName.trim() || !demo.lastName.trim() || !demo.email.trim()) {
      return err("First name, last name, and email are required.");
    }
    setBusy(true); setError(null);
    const res = await fetch("/api/admin/residents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ existingId: resident?.id, ...demo, yearsInMakati: demo.yearsInMakati || null }),
    });
    const data = await res.json();
    if (!res.ok) return err(data.error ?? "Failed to save resident.");
    setResident(data);
    setDetails(prev => ({
      ...prev,
      applicantBarangay: data.barangay ?? prev.applicantBarangay,
      voterStatus: data.voterStatus ?? prev.voterStatus,
    }));
    setBusy(false); setStep(3);
  }

  async function uploadDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentLabel.trim() || !resident) return;
    setUploading(true); setError(null);
    const fd = new FormData();
    fd.append("file", file); fd.append("label", currentLabel); fd.append("userId", resident.id);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Upload failed."); }
    else { setDocs(prev => [...prev, { label: currentLabel, fileUrl: data.url, fileType: file.type }]); setCurrentLabel(""); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit() {
    if (!resident || !appType) return;
    setBusy(true); setError(null);
    const res = await fetch("/api/admin/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: resident.id,
        type: appType,
        ...details,
        amountRequested: details.amountRequested ? parseFloat(details.amountRequested) : null,
        documents: docs,
      }),
    });
    const data = await res.json();
    if (!res.ok) return err(data.error ?? "Submission failed.");
    router.push(`/admin/applications/${data.id}?submitted=1`);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const cardCls = "bg-slate-900 rounded-2xl border border-slate-800 p-6";

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                ${done ? "bg-green-500 text-white" : active ? "bg-makati-blue text-white" : "bg-slate-700 text-slate-400"}`}>
                {done ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? "text-white" : "text-slate-500"}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${done ? "bg-green-500" : "bg-slate-700"}`} />}
            </div>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          <X className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ── Step 1: Find Resident ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className={cardCls}>
          <h2 className="text-lg font-bold text-white mb-1">Find Resident</h2>
          <p className="text-slate-400 text-sm mb-5">Search by name, email, or phone number.</p>

          <div className="flex gap-2 mb-4">
            <input
              type="text" value={query} placeholder="e.g. Juan dela Cruz or juan@email.com"
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchResidents()}
              className={inputCls}
            />
            <button onClick={searchResidents} disabled={searching || query.trim().length < 2}
              className="px-4 py-2.5 bg-makati-blue text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2 shrink-0">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>

          {results.length > 0 && (
            <div className="border border-slate-700 rounded-xl overflow-hidden mb-4">
              {results.map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800 border-b border-slate-800 last:border-b-0">
                  <div>
                    <p className="text-sm font-semibold text-white">{r.firstName} {r.lastName}</p>
                    <p className="text-xs text-slate-400">{r.email} {r.phone ? `· ${r.phone}` : ""} {r.barangay ? `· Brgy. ${r.barangay}` : ""}</p>
                    <div className="flex gap-1 mt-0.5">
                      {r.isPwd && <span className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">PWD</span>}
                      {r.isSenior && <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded">Senior</span>}
                      {r.voterStatus === "ACTIVE" && <span className="text-[10px] bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded">Voter ✓</span>}
                    </div>
                  </div>
                  <button onClick={() => pickResident(r)}
                    className="px-3 py-1.5 bg-makati-blue text-white text-xs font-semibold rounded-lg hover:bg-blue-800">
                    Select
                  </button>
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && query.length >= 2 && !searching && (
            <p className="text-slate-500 text-sm mb-4">No residents found for "{query}".</p>
          )}

          <div className="pt-4 border-t border-slate-800">
            <p className="text-slate-400 text-sm mb-3">Resident not found in the system?</p>
            <button onClick={startNew}
              className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-slate-600 text-slate-300 rounded-xl text-sm font-medium hover:border-makati-blue hover:text-white transition-colors">
              <UserPlus className="w-4 h-4" /> Register New Resident
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Demographics ──────────────────────────────────────────── */}
      {step === 2 && (
        <div className={cardCls}>
          <h2 className="text-lg font-bold text-white mb-1">
            {isNew ? "New Resident Profile" : `Update Profile — ${resident?.firstName} ${resident?.lastName}`}
          </h2>
          <p className="text-slate-400 text-sm mb-5">Fill in the resident's demographic information.</p>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Basic Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="First Name" required>
                  <input type="text" value={demo.firstName} onChange={e => setDemoField("firstName", e.target.value)} className={inputCls} placeholder="Juan" />
                </Field>
                <Field label="Last Name" required>
                  <input type="text" value={demo.lastName} onChange={e => setDemoField("lastName", e.target.value)} className={inputCls} placeholder="Dela Cruz" />
                </Field>
                <Field label="Middle Name">
                  <input type="text" value={demo.middleName} onChange={e => setDemoField("middleName", e.target.value)} className={inputCls} placeholder="Santos" />
                </Field>
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email Address" required>
                <input type="email" value={demo.email} onChange={e => setDemoField("email", e.target.value)} disabled={!isNew} className={inputCls} placeholder="juan@email.com" />
              </Field>
              <Field label="Phone Number">
                <input type="tel" value={demo.phone} onChange={e => setDemoField("phone", e.target.value)} className={inputCls} placeholder="09XXXXXXXXX" />
              </Field>
            </div>

            {/* Demographics */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Demographics</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Date of Birth">
                  <input type="date" value={demo.dateOfBirth} onChange={e => setDemoField("dateOfBirth", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Sex">
                  <SelectInput value={demo.sex} onChange={v => setDemoField("sex", v)} placeholder="Select sex"
                    options={[{ value: "MALE", label: "Male" }, { value: "FEMALE", label: "Female" }, { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" }]} />
                </Field>
                <Field label="Civil Status">
                  <SelectInput value={demo.civilStatus} onChange={v => setDemoField("civilStatus", v)} placeholder="Select status"
                    options={["SINGLE","MARRIED","WIDOWED","SEPARATED","ANNULLED"].map(v => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase() }))} />
                </Field>
              </div>
            </div>

            {/* Residency */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Makati Residency</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <Field label="Barangay">
                  <SelectInput value={demo.barangay} onChange={v => setDemoField("barangay", v)} placeholder="Select barangay"
                    options={BARANGAYS.map(b => ({ value: b, label: b }))} />
                </Field>
                <Field label="Years in Makati">
                  <input type="number" value={demo.yearsInMakati} onChange={e => setDemoField("yearsInMakati", e.target.value)} className={inputCls} placeholder="e.g. 10" min={0} />
                </Field>
              </div>
              <Field label="Home Address">
                <input type="text" value={demo.address} onChange={e => setDemoField("address", e.target.value)} className={inputCls} placeholder="Unit/House No., Street, Barangay, Makati City" />
              </Field>
            </div>

            {/* Voter & Tenurial */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Voter Status">
                <SelectInput value={demo.voterStatus} onChange={v => setDemoField("voterStatus", v)}
                  options={[
                    { value: "ACTIVE", label: "Active Makati Voter" },
                    { value: "INACTIVE", label: "Inactive" },
                    { value: "NOT_REGISTERED", label: "Not Registered" },
                    { value: "UNKNOWN", label: "Unknown / Pending Verification" },
                  ]} />
              </Field>
              <Field label="Tenurial Status (Residency Type)">
                <SelectInput value={demo.tenurialStatus} onChange={v => setDemoField("tenurialStatus", v)} placeholder="Select type"
                  options={[
                    { value: "OWNER", label: "Home Owner" },
                    { value: "RENTER", label: "Renter" },
                    { value: "SHARER", label: "Sharer" },
                    { value: "BEDSPACER", label: "Bedspacer" },
                  ]} />
              </Field>
            </div>

            {/* Sector flags */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sector Classification</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(["isSenior","isPwd","isSoloParent","isPregnant","isIndigent"] as const).map(key => (
                  <label key={key} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors
                    ${demo[key] ? "border-makati-blue bg-makati-blue/10 text-blue-300" : "border-slate-700 text-slate-400 hover:border-slate-600"}`}>
                    <input type="checkbox" checked={!!demo[key]} onChange={e => setDemoField(key, e.target.checked)} className="accent-makati-blue" />
                    <span className="text-sm font-medium capitalize">{key.replace("is", "")}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Conditional: PWD fields */}
            {demo.isPwd && (
              <div className="bg-blue-950/30 border border-blue-900/40 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">PWD Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Disability Type" required>
                    <SelectInput value={demo.disabilityType} onChange={v => setDemoField("disabilityType", v)} placeholder="Select type"
                      options={["PHYSICAL","VISUAL","HEARING","SPEECH","PSYCHOSOCIAL","INTELLECTUAL","LEARNING","AUTISM","CHRONIC_ILLNESS","MULTIPLE"]
                        .map(v => ({ value: v, label: v.replace("_"," ").charAt(0) + v.replace("_"," ").slice(1).toLowerCase() }))} />
                  </Field>
                  <Field label="PRPWD Number (if existing)">
                    <input type="text" value={demo.prpwdNumber} onChange={e => setDemoField("prpwdNumber", e.target.value)} className={inputCls} placeholder="PRPWD-XXXX-XXXXX" />
                  </Field>
                </div>
                <Field label="Cause / Nature of Disability">
                  <input type="text" value={demo.disabilityCause} onChange={e => setDemoField("disabilityCause", e.target.value)} className={inputCls} placeholder="e.g. Congenital, Accident, Illness" />
                </Field>
              </div>
            )}

            {/* Conditional: Senior fields */}
            {demo.isSenior && (
              <div className="bg-purple-950/30 border border-purple-900/40 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Senior Citizen Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Card Type">
                    <SelectInput value={demo.cardType} onChange={v => setDemoField("cardType", v)} placeholder="Select card type"
                      options={[{ value: "WHITE", label: "White Card (Basic)" }, { value: "BLUE", label: "Blue Card (Premium)" }]} />
                  </Field>
                  <Field label="NRSC Number (if existing)">
                    <input type="text" value={demo.nrscNumber} onChange={e => setDemoField("nrscNumber", e.target.value)} className={inputCls} placeholder="NRSC-XXXXXXX" />
                  </Field>
                </div>
                <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={demo.isBedridden} onChange={e => setDemoField("isBedridden", e.target.checked)} className="accent-makati-blue" />
                  Applicant is bedridden (home visitation required)
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-5 border-t border-slate-800">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2.5 text-slate-400 border border-slate-700 rounded-xl text-sm hover:bg-slate-800">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={saveResident} disabled={busy}
              className="flex items-center gap-2 px-6 py-2.5 bg-makati-blue text-white font-semibold rounded-xl text-sm hover:bg-blue-800 disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Save & Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Application Type ──────────────────────────────────────── */}
      {step === 3 && (
        <div className={cardCls}>
          <h2 className="text-lg font-bold text-white mb-1">Select Application Type</h2>
          {resident && (
            <p className="text-slate-400 text-sm mb-5">
              Filing for: <span className="text-white font-semibold">{resident.firstName} {resident.lastName}</span>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {APP_TYPES.map(({ type, label, description, icon: Icon, color }) => (
              <button key={type} onClick={() => setAppType(type)}
                className={`text-left p-4 rounded-xl border-2 transition-all
                  ${appType === type ? color + " ring-2 ring-offset-2 ring-offset-slate-900 ring-makati-blue" : "border-slate-700 bg-slate-800 hover:border-slate-600"}`}>
                <Icon className="w-6 h-6 mb-2" />
                <p className="font-semibold text-sm text-white">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-5 border-t border-slate-800">
            <button onClick={() => setStep(isNew ? 2 : 1)} className="flex items-center gap-2 px-4 py-2.5 text-slate-400 border border-slate-700 rounded-xl text-sm hover:bg-slate-800">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => { if (appType) setStep(4); }} disabled={!appType}
              className="flex items-center gap-2 px-6 py-2.5 bg-makati-blue text-white font-semibold rounded-xl text-sm hover:bg-blue-800 disabled:opacity-50">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Application Details ───────────────────────────────────── */}
      {step === 4 && appType && (
        <div className={cardCls}>
          <h2 className="text-lg font-bold text-white mb-1">Application Details</h2>
          <p className="text-slate-400 text-sm mb-5">
            <span className="text-white font-medium">{APP_TYPES.find(a => a.type === appType)?.label}</span> — fill in the intake-specific fields below.
          </p>

          <div className="space-y-4">
            {/* Common fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Applicant Barangay">
                <SelectInput value={details.applicantBarangay} onChange={v => setDetailField("applicantBarangay", v)} placeholder="Select barangay"
                  options={BARANGAYS.map(b => ({ value: b, label: b }))} />
              </Field>
              <Field label="Voter Status (Verified)">
                <SelectInput value={details.voterStatus} onChange={v => setDetailField("voterStatus", v)}
                  options={[
                    { value: "ACTIVE", label: "Active ✓" },
                    { value: "INACTIVE", label: "Inactive" },
                    { value: "NOT_REGISTERED", label: "Not Registered" },
                    { value: "UNKNOWN", label: "Unverified" },
                  ]} />
              </Field>
              <Field label="Tenurial Status">
                <SelectInput value={details.tenurialStatus} onChange={v => setDetailField("tenurialStatus", v)} placeholder="Select type"
                  options={[
                    { value: "OWNER", label: "Home Owner" },
                    { value: "RENTER", label: "Renter" },
                    { value: "SHARER", label: "Sharer" },
                    { value: "BEDSPACER", label: "Bedspacer" },
                  ]} />
              </Field>
            </div>

            {/* AICS-specific */}
            {appType === "AICS" && (
              <div className="bg-green-950/20 border border-green-900/40 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">AICS Details</p>
                <Field label="Crisis Category" required>
                  <SelectInput value={details.aicsCategory} onChange={v => setDetailField("aicsCategory", v)} placeholder="Select category"
                    options={AICS_CATEGORIES.map(c => ({ value: c, label: c.charAt(0) + c.slice(1).toLowerCase() }))} />
                </Field>
                <div className="bg-green-900/20 rounded-lg px-3 py-2.5 text-xs text-green-500 space-y-0.5">
                  <p className="font-semibold">Note for social worker:</p>
                  <p>The approved assistance amount is determined during the SCSR assessment and set by the MAC Coordinator — not by the resident. Do not ask the client how much they need.</p>
                </div>
              </div>
            )}

            {/* Calamity-specific */}
            {appType === "CALAMITY_RELIEF" && (
              <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Calamity Relief Details</p>
                <Field label="Active Disaster Incident" required>
                  {activeIncidents.length === 0 ? (
                    <p className="text-yellow-400 text-sm bg-yellow-900/20 border border-yellow-900/30 rounded-lg px-3 py-2">
                      No active disaster incidents. Create one under Disaster & Relief first.
                    </p>
                  ) : (
                    <SelectInput value={details.disasterIncidentId} onChange={v => setDetailField("disasterIncidentId", v)} placeholder="Select incident"
                      options={activeIncidents.map(i => ({ value: i.id, label: `${i.title} (${i.type})` }))} />
                  )}
                </Field>
              </div>
            )}

            {/* PWD-specific */}
            {appType === "PWD_ID" && (
              <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">PWD ID Details</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={details.prpwdEncoded} onChange={e => setDetailField("prpwdEncoded", e.target.checked)} className="accent-makati-blue" />
                    Encode to PRPWD National Registry
                  </label>
                  <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={details.homeDeliveryRequired} onChange={e => setDetailField("homeDeliveryRequired", e.target.checked)} className="accent-makati-blue" />
                    Requires home delivery (bedridden / mobility-impaired)
                  </label>
                  {details.homeDeliveryRequired && (
                    <Field label="Delivery Address">
                      <input type="text" value={details.homeDeliveryAddress} onChange={e => setDetailField("homeDeliveryAddress", e.target.value)}
                        className={inputCls} placeholder="Full delivery address" />
                    </Field>
                  )}
                </div>
              </div>
            )}

            {/* Senior Blue Card-specific */}
            {appType === "SENIOR_BLUE_CARD" && (
              <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-4">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Senior Blue Card Details</p>
                <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={details.orientationAttended} onChange={e => setDetailField("orientationAttended", e.target.checked)} className="accent-makati-blue" />
                  Applicant has attended the OSCA Orientation Seminar
                </label>
                {!details.orientationAttended && (
                  <p className="text-xs text-yellow-500 mt-2">⚠ Orientation is required before Blue Card approval can proceed.</p>
                )}
              </div>
            )}

            {/* Notes */}
            <Field label="Intake Notes (optional)">
              <textarea rows={3} value={details.notes} onChange={e => setDetailField("notes", e.target.value)}
                placeholder="Any observations, special circumstances, or additional context…"
                className={inputCls + " resize-none"} />
            </Field>
          </div>

          <div className="flex gap-3 mt-6 pt-5 border-t border-slate-800">
            <button onClick={() => setStep(3)} className="flex items-center gap-2 px-4 py-2.5 text-slate-400 border border-slate-700 rounded-xl text-sm hover:bg-slate-800">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(5)}
              className="flex items-center gap-2 px-6 py-2.5 bg-makati-blue text-white font-semibold rounded-xl text-sm hover:bg-blue-800">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Documents & Submit ────────────────────────────────────── */}
      {step === 5 && appType && (
        <div className={cardCls}>
          <h2 className="text-lg font-bold text-white mb-1">Documents & Submit</h2>
          <p className="text-slate-400 text-sm mb-5">Upload supporting documents. Required documents for this application type are listed below.</p>

          {/* Required document checklist */}
          <div className="bg-slate-800 rounded-xl p-4 mb-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Required Documents</p>
            <ul className="space-y-1.5">
              {REQUIRED_DOCS[appType].map(doc => {
                const uploaded = docs.some(d => d.label === doc);
                return (
                  <li key={doc} className={`flex items-center gap-2 text-sm ${uploaded ? "text-green-400" : "text-slate-400"}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${uploaded ? "bg-green-500 text-white" : "border border-slate-600"}`}>
                      {uploaded && "✓"}
                    </span>
                    {doc}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Upload area */}
          <div className="border border-dashed border-slate-600 rounded-xl p-4 space-y-3 mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upload Document</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Document Label" required>
                <input type="text" value={currentLabel} onChange={e => setCurrentLabel(e.target.value)}
                  list="doc-labels" placeholder="e.g. Medical Certificate"
                  className={inputCls} />
                <datalist id="doc-labels">
                  {REQUIRED_DOCS[appType].map(d => <option key={d} value={d} />)}
                </datalist>
              </Field>
              <Field label="File (PDF, JPG, PNG)">
                <input type="file" ref={fileRef} accept=".pdf,.jpg,.jpeg,.png"
                  onChange={uploadDoc} disabled={!currentLabel.trim() || uploading || !resident}
                  className="w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-makati-blue file:text-white hover:file:bg-blue-800 disabled:opacity-50 cursor-pointer" />
              </Field>
            </div>
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
              </div>
            )}
          </div>

          {/* Uploaded documents list */}
          {docs.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Uploaded ({docs.length})</p>
              {docs.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-800 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-sm text-white font-medium truncate flex-1">{doc.label}</span>
                  <span className="text-xs text-slate-500">{doc.fileType.split("/")[1]?.toUpperCase()}</span>
                  <button onClick={() => setDocs(prev => prev.filter((_, j) => j !== i))}
                    className="text-slate-600 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Review summary */}
          <div className="bg-slate-800 rounded-xl p-4 text-sm space-y-1.5 mb-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Application Summary</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
              <span className="text-slate-500">Resident</span>
              <span className="font-medium text-white">{resident?.firstName} {resident?.lastName}</span>
              <span className="text-slate-500">Type</span>
              <span className="font-medium text-white">{APP_TYPES.find(a => a.type === appType)?.label}</span>
              <span className="text-slate-500">Barangay</span>
              <span>{details.applicantBarangay || "—"}</span>
              <span className="text-slate-500">Voter Status</span>
              <span className={details.voterStatus === "ACTIVE" ? "text-green-400" : "text-yellow-400"}>{details.voterStatus}</span>
              {details.aicsCategory && <><span className="text-slate-500">Crisis Category</span><span className="capitalize">{details.aicsCategory.toLowerCase()}</span></>}
              <span className="text-slate-500">Documents</span>
              <span>{docs.length} file{docs.length !== 1 ? "s" : ""} uploaded</span>
            </div>
          </div>

          <div className="flex gap-3 pt-5 border-t border-slate-800">
            <button onClick={() => setStep(4)} className="flex items-center gap-2 px-4 py-2.5 text-slate-400 border border-slate-700 rounded-xl text-sm hover:bg-slate-800">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={submit} disabled={busy}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl text-sm hover:bg-green-700 disabled:opacity-50">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Check className="w-4 h-4" /> Submit Application</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
