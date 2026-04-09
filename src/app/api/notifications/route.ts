import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET  /api/notifications — recent notifications + unread count for the logged-in admin
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db
    .from("users")
    .select("id")
    .eq("supabaseId", user.id)
    .single();
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: notifications } = await db
    .from("notifications")
    .select("id, title, message, type, isRead, createdAt")
    .eq("userId", dbUser.id)
    .order("createdAt", { ascending: false })
    .limit(15);

  const items = notifications ?? [];
  const unreadCount = items.filter((n) => !n.isRead).length;

  return NextResponse.json({ notifications: items, unreadCount });
}

// PATCH /api/notifications — mark one or all as read
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db
    .from("users")
    .select("id")
    .eq("supabaseId", user.id)
    .single();
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id, markAll } = await request.json() as { id?: string; markAll?: boolean };

  if (markAll) {
    await db
      .from("notifications")
      .update({ isRead: true })
      .eq("userId", dbUser.id)
      .eq("isRead", false);
  } else if (id) {
    await db
      .from("notifications")
      .update({ isRead: true })
      .eq("id", id)
      .eq("userId", dbUser.id);
  }

  return NextResponse.json({ success: true });
}
