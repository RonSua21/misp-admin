import { getAdminUser } from "@/lib/auth-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import CertActionPanel from "@/components/certificates/CertActionPanel";
import Link from "next/link";

const CERT_LABELS: Record<string, string> = {
  INDIGENCY:    "Certificate of Indigency",
  LOW_INCOME:   "Low-Income Certificate",
  COHABITATION: "Cohabitation Certificate",
  SOLO_PARENT:  "Solo Parent Certificate",
  NO_INCOME:    "No-Income Certificate",
  GOOD_MORAL:   "Good Moral Character Certificate",
  RESIDENCY:    "Residency Certificate",
};

export default async function CertificateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dbUser = await getAdminUser();
  if (!dbUser) redirect("/login");

  const db = createAdminClient();
  const { data: req } = await db
    .from("certificate_requests")
    .select(`*, users!certificate_requests_userId_fkey(firstName, lastName, barangay, email, phone)`)
    .eq("id", id)
    .single();

  if (!req) notFound();

  const clientName = `${req.users?.firstName ?? ""} ${req.users?.lastName ?? ""}`.trim();

  return (
    <div>
      <TopBar
        title={`Certificate Request — ${req.referenceNumber}`}
        subtitle={`${CERT_LABELS[req.type] ?? req.type} · ${req.status}`}
      />
      <div className="p-6 max-w-4xl">
        <div className="mb-4">
          <Link href="/admin/certificates" className="text-sm text-makati-blue hover:underline">← Back to Certificates</Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left — Details */}
          <div className="md:col-span-2 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
              <h2 className="font-bold text-gray-900 dark:text-white">Request Details</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Reference No.</dt>
                  <dd className="font-mono font-semibold text-gray-800 dark:text-white mt-0.5">{req.referenceNumber}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Certificate Type</dt>
                  <dd className="text-gray-800 dark:text-white mt-0.5">{CERT_LABELS[req.type] ?? req.type}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Requested On</dt>
                  <dd className="text-gray-800 dark:text-white mt-0.5">{new Date(req.requestedAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Status</dt>
                  <dd className="mt-0.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">{req.status}</span>
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Purpose</dt>
                  <dd className="text-gray-800 dark:text-white mt-0.5">{req.purpose}</dd>
                </div>
                {req.remarks && (
                  <div className="col-span-2">
                    <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Remarks</dt>
                    <dd className="text-gray-800 dark:text-white mt-0.5">{req.remarks}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-3">
              <h2 className="font-bold text-gray-900 dark:text-white">Resident Information</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Full Name</dt>
                  <dd className="font-medium text-gray-800 dark:text-white mt-0.5">{clientName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Barangay</dt>
                  <dd className="text-gray-800 dark:text-white mt-0.5">{req.users?.barangay ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Email</dt>
                  <dd className="text-gray-800 dark:text-white mt-0.5">{req.users?.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Phone</dt>
                  <dd className="text-gray-800 dark:text-white mt-0.5">{req.users?.phone ?? "—"}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Right — Actions */}
          <div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-3">
              <h2 className="font-bold text-gray-900 dark:text-white">Actions</h2>
              <CertActionPanel certId={id} status={req.status} referenceNumber={req.referenceNumber} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
