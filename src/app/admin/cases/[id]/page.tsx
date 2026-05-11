import { getAdminUser } from "@/lib/auth-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import CaseStatusBadge from "@/components/cases/CaseStatusBadge";
import CaseNotesTimeline from "@/components/cases/CaseNotesTimeline";
import HomeVisitLog from "@/components/cases/HomeVisitLog";
import CaseStatusForm from "@/components/cases/CaseStatusForm";
import Link from "next/link";

const PRIORITY_COLORS: Record<string, string> = {
  LOW:    "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH:   "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dbUser = await getAdminUser();
  if (!dbUser) redirect("/login");

  const db = createAdminClient();

  const [{ data: caseData }, { data: notes }, { data: visits }, { data: staffUsers }] = await Promise.all([
    db.from("cases")
      .select(`*, client:users!cases_clientId_fkey(firstName, lastName, barangay, email, phone), worker:users!cases_assignedTo_fkey(firstName, lastName)`)
      .eq("id", id)
      .single(),
    db.from("case_notes")
      .select(`*, author:users!case_notes_authorId_fkey(firstName, lastName)`)
      .eq("caseId", id)
      .order("createdAt", { ascending: false }),
    db.from("home_visit_schedules")
      .select(`*, worker:users!home_visit_schedules_socialWorkerId_fkey(firstName, lastName)`)
      .eq("caseId", id)
      .order("scheduledAt", { ascending: false }),
    db.from("users").select("id, firstName, lastName").in("role", ["ADMIN", "SUPER_ADMIN"]),
  ]);

  if (!caseData) notFound();

  const clientName = `${caseData.client?.firstName ?? ""} ${caseData.client?.lastName ?? ""}`.trim();
  const mappedNotes = (notes ?? []).map((n: any) => ({ ...n, authorName: `${n.author?.firstName ?? ""} ${n.author?.lastName ?? ""}`.trim(), author: undefined }));
  const mappedVisits = (visits ?? []).map((v: any) => ({ ...v, workerName: `${v.worker?.firstName ?? ""} ${v.worker?.lastName ?? ""}`.trim(), worker: undefined }));
  const workers = (staffUsers ?? []).map((u: any) => ({ id: u.id, name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() }));

  return (
    <div>
      <TopBar title={`Case ${caseData.caseNumber}`} subtitle={`${caseData.category.replace(/_/g, " ")} · ${clientName}`} />
      <div className="p-6 max-w-5xl">
        <div className="mb-4 flex items-center gap-4">
          <Link href="/admin/cases" className="text-sm text-makati-blue hover:underline">← Back to Cases</Link>
          <CaseStatusBadge status={caseData.status} />
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[caseData.priority]}`}>{caseData.priority}</span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left — Notes + Visits */}
          <div className="md:col-span-2 space-y-6">
            {/* Client info */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-3">
              <h2 className="font-bold text-gray-900 dark:text-white">Client Information</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Name</dt>
                  <dd className="font-medium text-gray-800 dark:text-white mt-0.5">{clientName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Barangay</dt>
                  <dd className="text-gray-800 dark:text-white mt-0.5">{caseData.client?.barangay ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Email</dt>
                  <dd className="text-gray-800 dark:text-white mt-0.5">{caseData.client?.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Phone</dt>
                  <dd className="text-gray-800 dark:text-white mt-0.5">{caseData.client?.phone ?? "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">Description</dt>
                  <dd className="text-gray-800 dark:text-white mt-0.5 whitespace-pre-wrap">{caseData.description}</dd>
                </div>
              </dl>
            </div>

            {/* Case Notes */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-3">
              <h2 className="font-bold text-gray-900 dark:text-white">Case Notes</h2>
              <CaseNotesTimeline caseId={id} notes={mappedNotes} />
            </div>

            {/* Home Visits */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-3">
              <h2 className="font-bold text-gray-900 dark:text-white">Home Visits</h2>
              <HomeVisitLog caseId={id} visits={mappedVisits} socialWorkers={workers} />
            </div>
          </div>

          {/* Right — Status management */}
          <div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-3">
              <h2 className="font-bold text-gray-900 dark:text-white">Case Management</h2>
              <CaseStatusForm
                caseId={id}
                currentStatus={caseData.status}
                currentPriority={caseData.priority}
                currentAssignedTo={caseData.assignedTo ?? null}
                workers={workers}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
