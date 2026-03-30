import { getAdminUser } from "@/lib/auth-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import DocumentsTable from "@/components/documents/DocumentsTable";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const dbUser = await getAdminUser();
  if (!dbUser) redirect("/login");

  const db = createAdminClient();
  const isCoordinator = dbUser.role === "ADMIN";
  const brgy = dbUser.barangay ?? null;

  const search = params.search ?? "";
  const statusFilter = params.status ?? "";
  const page = parseInt(params.page ?? "1", 10);
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // If the coordinator filter or name search is active, resolve the matching
  // user IDs server-side first so the document query is properly filtered and
  // the paginated count stays accurate.
  const needsUserFilter = (isCoordinator && !!brgy) || !!search;
  let filteredUserIds: string[] | null = null;

  if (needsUserFilter) {
    let userQuery = db.from("users").select("id");
    if (isCoordinator && brgy) userQuery = userQuery.eq("barangay", brgy);
    if (search)
      userQuery = userQuery.or(
        `firstName.ilike.%${search}%,lastName.ilike.%${search}%`
      );
    const { data: matchingUsers } = await userQuery;
    filteredUserIds = (matchingUsers ?? []).map((u) => u.id);
  }

  // Short-circuit: filter active but no matching users → empty result.
  if (filteredUserIds !== null && filteredUserIds.length === 0) {
    return (
      <div>
        <TopBar
          title="Document Viewer"
          subtitle="Review and verify submitted resident documents"
        />
        <div className="p-6">
          <DocumentsTable
            documents={[]}
            total={0}
            page={page}
            pageSize={pageSize}
            currentSearch={search}
            currentStatus={statusFilter}
          />
        </div>
      </div>
    );
  }

  let query = db
    .from("documents")
    .select(
      "id, documentType, fileUrl, status, createdAt, userId, applicationId",
      { count: "exact" }
    )
    .order("createdAt", { ascending: false })
    .range(from, to);

  if (statusFilter) query = query.eq("status", statusFilter);
  if (filteredUserIds !== null) query = query.in("userId", filteredUserIds);

  const { data: documents, count } = await query;

  // Fetch display names for the page's documents only.
  const userIds = Array.from(new Set((documents ?? []).map((d) => d.userId)));
  const { data: users } = userIds.length
    ? await db
        .from("users")
        .select("id, firstName, lastName, barangay")
        .in("id", userIds)
    : { data: [] };

  const docsWithUsers = (documents ?? []).map((doc) => {
    const u = (users ?? []).find((u) => u.id === doc.userId);
    return {
      ...doc,
      applicantName: u ? `${u.firstName} ${u.lastName}` : "Unknown",
      barangay: u?.barangay ?? null,
    };
  });

  return (
    <div>
      <TopBar
        title="Document Viewer"
        subtitle="Review and verify submitted resident documents"
      />
      <div className="p-6">
        <DocumentsTable
          documents={docsWithUsers}
          total={count ?? 0}
          page={page}
          pageSize={pageSize}
          currentSearch={search}
          currentStatus={statusFilter}
        />
      </div>
    </div>
  );
}
