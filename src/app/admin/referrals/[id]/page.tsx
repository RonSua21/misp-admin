import { getAdminUser } from "@/lib/auth-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import ReferralNotesPanel from "@/components/referrals/ReferralNotesPanel";
import ReferralStatusForm from "@/components/referrals/ReferralStatusForm";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  ACCEPTED:  "bg-blue-100 text-blue-800",
  ACTIVE:    "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  DECLINED:  "bg-red-100 text-red-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  ROUTINE:   "bg-gray-100 text-gray-600",
  URGENT:    "bg-orange-100 text-orange-700",
  EMERGENCY: "bg-red-100 text-red-700",
};

export default async function ReferralDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dbUser = await getAdminUser();
  if (!dbUser) redirect("/login");

  const db = createAdminClient();

  const [{ data: ref }, { data: notes }] = await Promise.all([
    db.from("referrals")
      .select(`*, client:users!referrals_clientId_fkey(firstName, lastName, barangay, email, phone), referrer:users!referrals_referredBy_fkey(firstName, lastName), case:cases!referrals_caseId_fkey(caseNumber)`)
      .eq("id", id)
      .single(),
    db.from("referral_notes")
      .select(`*, author:users!referral_notes_authorId_fkey(firstName, lastName)`)
      .eq("referralId", id)
      .order("createdAt", { ascending: false }),
  ]);

  if (!ref) notFound();

  const clientName    = `${ref.client?.firstName ?? ""} ${ref.client?.lastName ?? ""}`.trim();
  const referredByName = `${ref.referrer?.firstName ?? ""} ${ref.referrer?.lastName ?? ""}`.trim();
  const mappedNotes   = (notes ?? []).map((n: any) => ({ ...n, authorName: `${n.author?.firstName ?? ""} ${n.author?.lastName ?? ""}`.trim(), author: undefined }));

  return (
    <div>
      <TopBar title={`Referral — ${ref.referralCode}`} subtitle={`${ref.referredTo} · ${ref.status}`} />
      <div className="p-6 max-w-4xl">
        <div className="mb-4">
          <Link href="/admin/referrals" className="text-sm text-makati-blue hover:underline">← Back to Referrals</Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-gray-900 dark:text-white">Referral Details</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[ref.status]}`}>{ref.status}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[ref.priority]}`}>{ref.priority}</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Client</dt>
                  <dd className="font-medium text-gray-800 dark:text-white mt-0.5">{clientName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Barangay</dt>
                  <dd className="text-gray-800 dark:text-white mt-0.5">{ref.client?.barangay ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Referred To</dt>
                  <dd className="text-gray-800 dark:text-white mt-0.5">{ref.referredTo}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Referred By</dt>
                  <dd className="text-gray-800 dark:text-white mt-0.5">{referredByName}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Service Needed</dt>
                  <dd className="text-gray-800 dark:text-white mt-0.5">{ref.serviceNeeded}</dd>
                </div>
                {ref.case?.caseNumber && (
                  <div className="col-span-2">
                    <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Linked Case</dt>
                    <dd className="mt-0.5">
                      <Link href={`/admin/cases/${ref.caseId}`} className="text-makati-blue hover:underline font-mono text-xs">{ref.case.caseNumber}</Link>
                    </dd>
                  </div>
                )}
                {ref.outcome && (
                  <div className="col-span-2">
                    <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Outcome</dt>
                    <dd className="text-gray-800 dark:text-white mt-0.5 whitespace-pre-wrap">{ref.outcome}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-3">
              <h2 className="font-bold text-gray-900 dark:text-white">Notes</h2>
              <ReferralNotesPanel referralId={id} notes={mappedNotes} />
            </div>
          </div>

          <div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-3">
              <h2 className="font-bold text-gray-900 dark:text-white">Update Status</h2>
              <ReferralStatusForm referralId={id} currentStatus={ref.status} currentOutcome={ref.outcome} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
