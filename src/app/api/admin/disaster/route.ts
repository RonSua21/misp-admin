import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/notifications";

// GET /api/admin/disaster — list all incidents
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAdminClient();
    const { data, error } = await db
      .from("disaster_incidents")
      .select("*")
      .order("reportedAt", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/admin/disaster]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/admin/disaster — create incident
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAdminClient();

    // Get internal user id for createdBy
    const { data: dbUser } = await db
      .from("users")
      .select("id, role")
      .eq("supabaseId", user.id)
      .single();

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();
    const { title, type, description, barangay } = body;

    if (!title || !type) {
      return NextResponse.json({ error: "title and type are required." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data, error } = await db
      .from("disaster_incidents")
      .insert({
        id:          crypto.randomUUID(),
        title,
        type,
        description: description ?? null,
        barangay:    barangay    ?? null,
        status:      "ACTIVE",
        reportedAt:  now,
        createdBy:   dbUser.id,
        createdAt:   now,
        updatedAt:   now,
      })
      .select()
      .single();

    if (error) throw error;

    // Notify other admins about the new incident (non-blocking, exclude the reporter)
    notifyAdmins({
      title: `New Incident: ${title}`,
      message: `A new ${type.toLowerCase()} incident has been reported${barangay ? ` in Brgy. ${barangay}` : ""}.`,
      type: "DISASTER_ALERT",
      excludeUserId: dbUser.id,
    }).catch((e) => console.error("[notifyAdmins disaster]", e));

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/disaster]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
