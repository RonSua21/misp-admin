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
  const date        = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const status      = searchParams.get("status") ?? "";
  const serviceType = searchParams.get("serviceType") ?? "";
  const page        = parseInt(searchParams.get("page") ?? "1", 10);
  const size        = 20;
  const from        = (page - 1) * size;
  const to          = from + size - 1;

  let q = db
    .from("appointments")
    .select(
      `id, userId, serviceType, preferredDate, preferredTime, status, notes, isWalkIn, queueNumber, assignedTo, confirmedAt, completedAt, cancelledAt, createdAt,
       users!appointments_userId_fkey(firstName, lastName)`,
      { count: "exact" }
    )
    .eq("preferredDate", date)
    .order("preferredTime", { ascending: true })
    .range(from, to);

  if (status)      q = q.eq("status", status);
  if (serviceType) q = q.eq("serviceType", serviceType);

  const { data: raw, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const appointments = (raw ?? []).map((a: any) => ({
    ...a,
    clientName: `${a.users?.firstName ?? ""} ${a.users?.lastName ?? ""}`.trim() || "Walk-in",
    users: undefined,
  }));
  return NextResponse.json({ appointments, total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  // Create a walk-in appointment
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { serviceType, notes, assignedTo } = await req.json();
  if (!serviceType) return NextResponse.json({ error: "Service type is required." }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  const now   = new Date();
  const preferredTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Count walk-ins today to generate queue number
  const { count: walkInCount } = await db
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("preferredDate", today)
    .eq("isWalkIn", true);

  const seq         = (walkInCount ?? 0) + 1;
  const queueNumber = `W-${String(seq).padStart(3, "0")}`;

  const { data, error } = await db
    .from("appointments")
    .insert({
      serviceType,
      notes: notes ?? null,
      assignedTo: assignedTo ?? null,
      preferredDate: today,
      preferredTime,
      isWalkIn: true,
      queueNumber,
      status: "CONFIRMED",
      confirmedAt: now.toISOString(),
    })
    .select("id, queueNumber")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
