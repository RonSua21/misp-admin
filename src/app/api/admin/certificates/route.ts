import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role, barangay").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status  = searchParams.get("status") ?? "";
  const type    = searchParams.get("type") ?? "";
  const search  = searchParams.get("search") ?? "";
  const page    = parseInt(searchParams.get("page") ?? "1", 10);
  const size    = 10;
  const from    = (page - 1) * size;
  const to      = from + size - 1;

  let q = db
    .from("certificate_requests")
    .select(
      `id, userId, type, purpose, status, referenceNumber, remarks, requestedAt, releasedAt,
       users!certificate_requests_userId_fkey(firstName, lastName, barangay)`,
      { count: "exact" }
    )
    .order("requestedAt", { ascending: false })
    .range(from, to);

  if (status) q = q.eq("status", status);
  if (type)   q = q.eq("type", type);
  if (search) q = q.ilike("referenceNumber", `%${search}%`);

  // Scope coordinators to their barangay via a sub-filter on the joined users table
  const isCoordinator = dbUser.role === "ADMIN" && dbUser.barangay;
  if (isCoordinator) {
    // We filter after fetching since Supabase doesn't support deep filter on joined tables in one step
    const { data: raw, count } = await q;
    const filtered = (raw ?? []).filter((r: any) => r.users?.barangay === dbUser.barangay);
    const requests = filtered.map((r: any) => ({
      ...r,
      clientName: `${r.users?.firstName ?? ""} ${r.users?.lastName ?? ""}`.trim(),
      clientBarangay: r.users?.barangay,
      users: undefined,
    }));
    return NextResponse.json({ requests, total: count ?? 0 });
  }

  const { data: raw, count } = await q;
  const requests = (raw ?? []).map((r: any) => ({
    ...r,
    clientName: `${r.users?.firstName ?? ""} ${r.users?.lastName ?? ""}`.trim(),
    clientBarangay: r.users?.barangay,
    users: undefined,
  }));
  return NextResponse.json({ requests, total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  // Public-facing: resident submits a certificate request
  // Auth via resident session (REGISTERED_USER)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { type, purpose } = body;
  if (!type || !purpose?.trim()) return NextResponse.json({ error: "Type and purpose are required." }, { status: 400 });

  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  const referenceNumber = `CERT-${year}-${suffix}`;

  const { data, error } = await db
    .from("certificate_requests")
    .insert({ userId: dbUser.id, type, purpose: purpose.trim(), referenceNumber })
    .select("id, referenceNumber")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  notifyAdmins({ title: "New Certificate Request", message: `A resident has submitted a ${type} certificate request (${referenceNumber}).`, type: "APPLICATION_UPDATE" }).catch(() => {});

  return NextResponse.json(data, { status: 201 });
}
