import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const search   = searchParams.get("search") ?? "";
  const page     = parseInt(searchParams.get("page") ?? "1", 10);
  const size     = 10;
  const from     = (page - 1) * size;
  const to       = from + size - 1;

  let q = db
    .from("referrals")
    .select(
      `id, caseId, clientId, referredBy, referredTo, serviceNeeded, priority, status, referralCode, referralDate, responseDate, outcome, createdAt,
       client:users!referrals_clientId_fkey(firstName, lastName),
       referrer:users!referrals_referredBy_fkey(firstName, lastName),
       case:cases!referrals_caseId_fkey(caseNumber)`,
      { count: "exact" }
    )
    .order("referralDate", { ascending: false })
    .range(from, to);

  if (status)   q = q.eq("status", status);
  if (priority) q = q.eq("priority", priority);
  if (search)   q = q.ilike("referralCode", `%${search}%`);

  const { data: raw, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const referrals = (raw ?? []).map((r: any) => ({
    ...r,
    clientName: `${r.client?.firstName ?? ""} ${r.client?.lastName ?? ""}`.trim(),
    referredByName: `${r.referrer?.firstName ?? ""} ${r.referrer?.lastName ?? ""}`.trim(),
    caseNumber: r.case?.caseNumber ?? null,
    client: undefined,
    referrer: undefined,
    case: undefined,
  }));
  return NextResponse.json({ referrals, total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clientId, referredTo, serviceNeeded, priority, caseId } = await req.json();
  if (!clientId || !referredTo?.trim() || !serviceNeeded?.trim())
    return NextResponse.json({ error: "clientId, referredTo, and serviceNeeded are required." }, { status: 400 });

  const year   = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  const referralCode = `REF-${year}-${suffix}`;

  const { data, error } = await db
    .from("referrals")
    .insert({
      clientId,
      referredBy: dbUser.id,
      referredTo: referredTo.trim(),
      serviceNeeded: serviceNeeded.trim(),
      priority: priority ?? "ROUTINE",
      referralCode,
      caseId: caseId ?? null,
      updatedAt: new Date().toISOString(),
    })
    .select("id, referralCode")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
