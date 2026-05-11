import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcastNotification } from "@/lib/notifications";
import type { NotificationType } from "@/lib/notifications";

// POST /api/admin/announcements — broadcast a notification to all registered users
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db
    .from("users")
    .select("role")
    .eq("supabaseId", user.id)
    .single();

  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, message, type } = await request.json() as {
    title: string;
    message: string;
    type: NotificationType;
  };

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
  }

  const validTypes: NotificationType[] = ["APPLICATION_UPDATE", "ANNOUNCEMENT", "DISASTER_ALERT"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid notification type." }, { status: 400 });
  }

  const count = await broadcastNotification({ title: title.trim(), message: message.trim(), type });
  return NextResponse.json({ success: true, sentTo: count });
}

// GET /api/admin/announcements — list recent broadcasts (from notifications with no specific targeting)
// We read the latest distinct (title, createdAt) rows to reconstruct broadcast history
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();

  // Get a sample of recent announcements/alerts (one representative row per batch)
  // We identify broadcasts by type and approximate createdAt (within 1 second)
  const { data } = await db
    .from("notifications")
    .select("id, title, message, type, createdAt")
    .in("type", ["ANNOUNCEMENT", "DISASTER_ALERT"])
    .order("createdAt", { ascending: false })
    .limit(200);

  if (!data) return NextResponse.json({ broadcasts: [] });

  // Deduplicate: keep first occurrence of each (title, message) pair
  const seen = new Set<string>();
  const broadcasts = data.filter((n) => {
    const key = `${n.title}||${n.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 20);

  return NextResponse.json({ broadcasts });
}
