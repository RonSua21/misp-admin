import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: raw } = await db
    .from("home_visit_schedules")
    .select(`*, worker:users!home_visit_schedules_socialWorkerId_fkey(firstName, lastName)`)
    .eq("caseId", id)
    .order("scheduledAt", { ascending: false });

  const visits = (raw ?? []).map((v: any) => ({
    ...v,
    workerName: `${v.worker?.firstName ?? ""} ${v.worker?.lastName ?? ""}`.trim(),
    worker: undefined,
  }));
  return NextResponse.json({ visits });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { scheduledAt, socialWorkerId } = await req.json();
  if (!scheduledAt || !socialWorkerId)
    return NextResponse.json({ error: "scheduledAt and socialWorkerId are required." }, { status: 400 });

  const { data, error } = await db
    .from("home_visit_schedules")
    .insert({ caseId: id, scheduledAt, socialWorkerId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // caseId not needed for update
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { visitId, conductedAt, findings } = await req.json();
  if (!visitId) return NextResponse.json({ error: "visitId is required." }, { status: 400 });

  const { error } = await db
    .from("home_visit_schedules")
    .update({ conductedAt: conductedAt ?? new Date().toISOString(), findings: findings ?? null })
    .eq("id", visitId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
