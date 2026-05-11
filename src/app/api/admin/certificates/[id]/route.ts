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

  const { data, error } = await db
    .from("certificate_requests")
    .select(`*, users!certificate_requests_userId_fkey(firstName, lastName, barangay, email, phone)`)
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const request = {
    ...data,
    clientName: `${data.users?.firstName ?? ""} ${data.users?.lastName ?? ""}`.trim(),
    clientBarangay: data.users?.barangay,
    clientEmail: data.users?.email,
    clientPhone: data.users?.phone,
    users: undefined,
  };
  return NextResponse.json(request);
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

  const { action, remarks } = await req.json();
  if (!["approve", "reject", "release"].includes(action))
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });

  const { data: existing } = await db.from("certificate_requests").select("id, userId, referenceNumber, status").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();
  let update: Record<string, unknown> = {};
  let newStatus = "";
  let notifTitle = "";
  let notifMsg = "";

  if (action === "approve") {
    newStatus = "APPROVED";
    update = { status: "APPROVED", reviewedBy: dbUser.id, reviewedAt: now, remarks: remarks ?? null };
    notifTitle = "Certificate Request Approved";
    notifMsg = `Your certificate request (${existing.referenceNumber}) has been approved. Please visit the MSWD office to claim it.`;
  } else if (action === "reject") {
    newStatus = "REJECTED";
    update = { status: "REJECTED", reviewedBy: dbUser.id, reviewedAt: now, remarks: remarks ?? null };
    notifTitle = "Certificate Request Not Approved";
    notifMsg = `Your certificate request (${existing.referenceNumber}) was not approved.${remarks ? ` Reason: ${remarks}` : " Please contact the MSWD office for details."}`;
  } else {
    newStatus = "RELEASED";
    update = { status: "RELEASED", releasedBy: dbUser.id, releasedAt: now };
    notifTitle = "Certificate Released";
    notifMsg = `Your certificate (${existing.referenceNumber}) has been released. Thank you for visiting the MSWD office.`;
  }

  const { error } = await db.from("certificate_requests").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  createNotification({ userId: existing.userId, title: notifTitle, message: notifMsg, type: "APPLICATION_UPDATE" }).catch(() => {});

  return NextResponse.json({ success: true, newStatus });
}
