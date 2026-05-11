import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role, barangay").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status     = searchParams.get("status") ?? "";
  const category   = searchParams.get("category") ?? "";
  const assignedTo = searchParams.get("assignedTo") ?? "";
  const barangay   = searchParams.get("barangay") ?? "";
  const search     = searchParams.get("search") ?? "";
  const page       = parseInt(searchParams.get("page") ?? "1", 10);
  const size       = 10;
  const from       = (page - 1) * size;
  const to         = from + size - 1;

  let q = db
    .from("cases")
    .select(
      `id, caseNumber, clientId, assignedTo, category, priority, status, description, barangay, createdAt, updatedAt,
       client:users!cases_clientId_fkey(firstName, lastName),
       worker:users!cases_assignedTo_fkey(firstName, lastName)`,
      { count: "exact" }
    )
    .order("createdAt", { ascending: false })
    .range(from, to);

  const scopedBarangay = dbUser.role === "ADMIN" && dbUser.barangay ? dbUser.barangay : barangay;
  if (scopedBarangay) q = q.eq("barangay", scopedBarangay);
  if (status)         q = q.eq("status", status);
  if (category)       q = q.eq("category", category);
  if (assignedTo)     q = q.eq("assignedTo", assignedTo);
  if (search)         q = q.ilike("caseNumber", `%${search}%`);

  const { data: raw, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const cases = (raw ?? []).map((c: any) => ({
    ...c,
    clientName: `${c.client?.firstName ?? ""} ${c.client?.lastName ?? ""}`.trim(),
    assignedWorkerName: c.worker ? `${c.worker.firstName ?? ""} ${c.worker.lastName ?? ""}`.trim() : null,
    client: undefined,
    worker: undefined,
  }));
  return NextResponse.json({ cases, total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role, barangay").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clientId, category, priority, description, barangay, assignedTo } = await req.json();
  if (!clientId || !category || !description?.trim())
    return NextResponse.json({ error: "clientId, category, and description are required." }, { status: 400 });

  const year   = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  const caseNumber = `CASE-${year}-${suffix}`;

  const { data, error } = await db
    .from("cases")
    .insert({
      caseNumber,
      clientId,
      category,
      priority: priority ?? "MEDIUM",
      description: description.trim(),
      barangay: barangay ?? null,
      assignedTo: assignedTo ?? null,
      createdBy: dbUser.id,
      updatedAt: new Date().toISOString(),
    })
    .select("id, caseNumber")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (assignedTo) {
    createNotification({ userId: assignedTo, title: "New Case Assigned", message: `Case ${caseNumber} has been assigned to you.`, type: "APPLICATION_UPDATE" }).catch(() => {});
  }

  return NextResponse.json(data, { status: 201 });
}
