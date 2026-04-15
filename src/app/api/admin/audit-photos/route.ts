import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET  /api/admin/audit-photos?entityType=APPLICATION&entityId=xxx
 * POST /api/admin/audit-photos
 *
 * Stores geo-tagged photo metadata for COA compliance.
 * The file upload itself happens directly from the browser to Supabase Storage.
 * This route only records the metadata row.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId   = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType and entityId are required." }, { status: 400 });
    }

    const db = createAdminClient();
    const { data, error } = await db
      .from("audit_photos")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("taken_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET audit-photos]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAdminClient();
    const { data: dbUser } = await db
      .from("users")
      .select("id, role")
      .eq("supabaseId", user.id)
      .single();

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { entityType, entityId, fileUrl, latitude, longitude } = await request.json();

    if (!entityType || !entityId || !fileUrl) {
      return NextResponse.json(
        { error: "entityType, entityId, and fileUrl are required." },
        { status: 400 }
      );
    }

    if (!["APPLICATION", "DISBURSEMENT", "DISTRIBUTION"].includes(entityType)) {
      return NextResponse.json(
        { error: "entityType must be APPLICATION, DISBURSEMENT, or DISTRIBUTION." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await db
      .from("audit_photos")
      .insert({
        id:          crypto.randomUUID(),
        entity_type: entityType,
        entity_id:   entityId,
        file_url:    fileUrl,
        latitude:    latitude  ?? null,
        longitude:   longitude ?? null,
        taken_at:    now,
        uploaded_by: dbUser.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST audit-photos]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
