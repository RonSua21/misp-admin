import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [{ data: caseData }, { data: notes }, { data: visits }] = await Promise.all([
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
  ]);

  if (!caseData) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...caseData,
    clientName: `${caseData.client?.firstName ?? ""} ${caseData.client?.lastName ?? ""}`.trim(),
    clientBarangay: caseData.client?.barangay,
    clientEmail: caseData.client?.email,
    clientPhone: caseData.client?.phone,
    assignedWorkerName: caseData.worker ? `${caseData.worker.firstName ?? ""} ${caseData.worker.lastName ?? ""}`.trim() : null,
    client: undefined,
    worker: undefined,
    notes: (notes ?? []).map((n: any) => ({
      ...n,
      authorName: `${n.author?.firstName ?? ""} ${n.author?.lastName ?? ""}`.trim(),
      author: undefined,
    })),
    visits: (visits ?? []).map((v: any) => ({
      ...v,
      workerName: `${v.worker?.firstName ?? ""} ${v.worker?.lastName ?? ""}`.trim(),
      worker: undefined,
    })),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status, priority, assignedTo, description } = await req.json();

  const { data: existing } = await db.from("cases").select("clientId, caseNumber, status").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (status)      update.status      = status;
  if (priority)    update.priority    = priority;
  if (assignedTo !== undefined) update.assignedTo = assignedTo;
  if (description) update.description = description;

  const { error } = await db.from("cases").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (status === "CLOSED" && existing.clientId) {
    createNotification({ userId: existing.clientId, title: "Case Closed", message: `Your case ${existing.caseNumber} has been closed. Please contact MSWD if you need further assistance.`, type: "APPLICATION_UPDATE" }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
