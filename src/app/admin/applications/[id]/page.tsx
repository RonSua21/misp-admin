import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, MapPin, Phone, Calendar, FileText, DollarSign } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import StatusUpdateForm from "@/components/applications/StatusUpdateForm";
import type { ApplicationStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  DISBURSED: "bg-purple-100 text-purple-800",
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createAdminClient();
  const { data: dbUser } = await db
    .from("users")
    .select("role, barangay")
    .eq("supabaseId", user.id)
    .single();
  if (!dbUser) redirect("/login");

  const { data: app } = await db
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (!app) notFound();

  // Role-gate: coordinators can only see their barangay's apps
  if (
    dbUser.role === "ADMIN" &&
    dbUser.barangay &&
    app.applicantBarangay !== dbUser.barangay
  ) {
    redirect("/admin/applications");
  }

  const { data: program } = await db
    .from("benefit_programs")
    .select("name, category, description, maxAmount")
    .eq("id", app.benefitProgramId)
    .single();

  const { data: applicantUser } = await db
    .from("users")
    .select("firstName, lastName, email, phone, residencyVerified, createdAt")
    .eq("id", app.userId)
    .maybeSingle();

  const { data: statusHistory } = await db
    .from("application_status_history")
    .select("id, fromStatus, toStatus, changedAt, remarks, changedBy")
    .eq("applicationId", id)
    .order("changedAt", { ascending: false });

  const { data: documents } = await db
    .from("documents")
    .select("id, documentType, fileUrl, status, createdAt")
    .eq("applicationId", id);

  return (
    <div>
      <TopBar
        title="Application Detail"
        subtitle={`Reference: ${app.referenceNumber}`}
      />
      <div className="p-6 space-y-6 max-w-6xl">
        {/* Back link */}
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-makati-blue dark:hover:text-makati-blue"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Application Queue
        </Link>

        {/* Header card */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-sm text-makati-blue font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                  {app.referenceNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    STATUS_COLORS[app.status as ApplicationStatus]
                  }`}
                >
                  {app.status.replace(/_/g, " ")}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {app.applicantName}
              </h2>
              <div className="flex flex-wrap gap-3 mt-2">
                {app.applicantBarangay && (
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    Brgy. {app.applicantBarangay}
                  </span>
                )}
                {app.applicantContact && (
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                    {app.applicantContact}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Submitted {formatDate(app.createdAt)}
                </span>
              </div>
            </div>
            <div className="text-right">
              {app.amountRequested && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    Amount Requested
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(app.amountRequested)}
                  </p>
                </div>
              )}
              {app.amountApproved && (
                <div className="mt-1">
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    Amount Approved
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(app.amountApproved)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application details */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-makati-blue" />
                Application Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                    Benefit Program
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {program?.name ?? "—"}
                  </p>
                  {program?.category && (
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      {program.category.replace(/_/g, " ")}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                    Purpose / Reason
                  </p>
                  <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">
                    {app.purpose}
                  </p>
                </div>
                {app.remarks && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                      Admin Remarks
                    </p>
                    <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                      {app.remarks}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Submitted Documents
              </h3>
              {!documents || documents.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500">
                  No documents submitted.
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {doc.documentType.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          Uploaded {formatDate(doc.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            doc.status === "VERIFIED"
                              ? "bg-green-100 text-green-800"
                              : doc.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {doc.status}
                        </span>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-makati-blue hover:underline font-medium"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status History */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Status History
              </h3>
              {!statusHistory || statusHistory.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500">
                  No status changes recorded.
                </p>
              ) : (
                <div className="space-y-3">
                  {statusHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex gap-3 text-sm"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-makati-blue mt-1.5 shrink-0" />
                      <div>
                        <p className="text-gray-900 dark:text-white">
                          <span className="font-semibold">
                            {entry.fromStatus?.replace(/_/g, " ") ?? "Created"}
                          </span>{" "}
                          &rarr;{" "}
                          <span className="font-semibold">
                            {entry.toStatus.replace(/_/g, " ")}
                          </span>
                        </p>
                        {entry.remarks && (
                          <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
                            &quot;{entry.remarks}&quot;
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                          {formatDate(entry.changedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Applicant info */}
            {applicantUser && (
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-makati-blue" />
                  Applicant Account
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      Full Name
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {applicantUser.firstName} {applicantUser.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      Email
                    </p>
                    <p className="text-gray-700 dark:text-slate-300">
                      {applicantUser.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      Residency
                    </p>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        applicantUser.residencyVerified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {applicantUser.residencyVerified
                        ? "Verified"
                        : "Unverified"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      Member Since
                    </p>
                    <p className="text-gray-700 dark:text-slate-300">
                      {formatDate(applicantUser.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Financial summary */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-makati-blue" />
                Financial Summary
              </h3>
              <div className="space-y-2 text-sm">
                {program?.maxAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">
                      Program Max
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(program.maxAmount)}
                    </span>
                  </div>
                )}
                {app.amountRequested && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">
                      Requested
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(app.amountRequested)}
                    </span>
                  </div>
                )}
                {app.amountApproved && (
                  <div className="flex justify-between border-t border-gray-100 dark:border-slate-700 pt-2">
                    <span className="text-gray-500 dark:text-slate-400">
                      Approved
                    </span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(app.amountApproved)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Update Form */}
            <StatusUpdateForm
              applicationId={app.id}
              currentStatus={app.status as ApplicationStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
