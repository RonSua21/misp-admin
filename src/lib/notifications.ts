"use server";
import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationType =
  | "APPLICATION_UPDATE"
  | "ANNOUNCEMENT"
  | "DISASTER_ALERT";

/**
 * Creates a notification for a single user.
 * Plug into application-status updates, disaster alerts, etc.
 */
export async function createNotification({
  userId,
  title,
  message,
  type,
}: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}) {
  const db = createAdminClient();
  const { error } = await db.from("notifications").insert({
    id: crypto.randomUUID(),
    userId,
    title,
    message,
    type,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
  if (error) console.error("[createNotification]", error);
}

/**
 * Broadcasts a notification to ALL registered users (fan-out).
 * Used by the /admin/announcements page.
 *
 * Returns the number of users notified.
 */
export async function broadcastNotification({
  title,
  message,
  type,
}: {
  title: string;
  message: string;
  type: NotificationType;
}): Promise<number> {
  const db = createAdminClient();

  // Fetch all active registered users
  const { data: users } = await db
    .from("users")
    .select("id")
    .eq("role", "REGISTERED_USER")
    .eq("isActive", true);

  if (!users || users.length === 0) return 0;

  const now = new Date().toISOString();
  const rows = users.map((u) => ({
    id: crypto.randomUUID(),
    userId: u.id,
    title,
    message,
    type,
    isRead: false,
    createdAt: now,
  }));

  const { error } = await db.from("notifications").insert(rows);
  if (error) {
    console.error("[broadcastNotification]", error);
    return 0;
  }

  return users.length;
}

/**
 * Sends a notification to ALL active admin and super-admin users.
 * Used by admin-side actions to alert other staff members.
 *
 * @param excludeUserId - optional app-level user id to skip (e.g. the actor themselves)
 */
export async function notifyAdmins({
  title,
  message,
  type,
  excludeUserId,
}: {
  title: string;
  message: string;
  type: NotificationType;
  excludeUserId?: string;
}) {
  const db = createAdminClient();

  let query = db
    .from("users")
    .select("id")
    .in("role", ["ADMIN", "SUPER_ADMIN"])
    .eq("isActive", true);

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data: admins } = await query;
  if (!admins || admins.length === 0) return;

  const now = new Date().toISOString();
  const rows = admins.map((a) => ({
    id: crypto.randomUUID(),
    userId: a.id,
    title,
    message,
    type,
    isRead: false,
    createdAt: now,
  }));

  const { error } = await db.from("notifications").insert(rows);
  if (error) console.error("[notifyAdmins]", error);
}
