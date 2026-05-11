import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, assignedTo } = await req.json();
  if (!["confirm", "complete", "cancel", "no_show"].includes(action))
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });

  const { data: existing } = await db.from("appointments").select("id, userId, serviceType, status").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();
  let update: Record<string, unknown> = {};
  let newStatus = "";

  switch (action) {
    case "confirm":
      newStatus = "CONFIRMED";
      update = { status: "CONFIRMED", confirmedAt: now, ...(assignedTo ? { assignedTo } : {}) };
      break;
    case "complete":
      newStatus = "COMPLETED";
      update = { status: "COMPLETED", completedAt: now };
      break;
    case "cancel":
      newStatus = "CANCELLED";
      update = { status: "CANCELLED", cancelledAt: now };
      break;
    case "no_show":
      newStatus = "NO_SHOW";
      update = { status: "NO_SHOW" };
      break;
  }

  const { error } = await db.from("appointments").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (existing.userId && (action === "confirm" || action === "cancel")) {
    const titles: Record<string, string> = {
      confirm: "Appointment Confirmed",
      cancel:  "Appointment Cancelled",
    };
    const messages: Record<string, string> = {
      confirm: `Your appointment for ${existing.serviceType.replace(/_/g, " ")} has been confirmed.`,
      cancel:  `Your appointment for ${existing.serviceType.replace(/_/g, " ")} has been cancelled. Please contact MSWD to reschedule.`,
    };
    createNotification({ userId: existing.userId, title: titles[action], message: messages[action], type: "APPLICATION_UPDATE" }).catch(() => {});
  }

  return NextResponse.json({ success: true, newStatus });
}
