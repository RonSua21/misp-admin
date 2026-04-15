import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET  /api/admin/applications/[id]/id-issuance — list all booklet issuances
 * POST /api/admin/applications/[id]/id-issuance — record a new booklet issuance
 *
 * Only available when application status is APPROVED or DISBURSED.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAdminClient();
    const { data, error } = await db
      .from("id_issuances")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET id-issuance]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify application is approved
    const { data: app } = await db
      .from("applications")
      .select("status, userId")
      .eq("id", id)
      .single();

    if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    if (app.status !== "APPROVED" && app.status !== "DISBURSED") {
      return NextResponse.json(
        { error: "Can only issue booklets for APPROVED or DISBURSED applications." },
        { status: 422 }
      );
    }

    const { bookletType, bookletNumber, claimDate, signatureUrl } = await request.json();
    if (!bookletType || !["MEDICINE", "GROCERY", "MOVIE"].includes(bookletType)) {
      return NextResponse.json(
        { error: "bookletType must be MEDICINE, GROCERY, or MOVIE." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await db
      .from("id_issuances")
      .insert({
        id:             crypto.randomUUID(),
        application_id: id,
        user_id:        app.userId,
        booklet_type:   bookletType,
        booklet_number: bookletNumber ?? null,
        claim_date:     claimDate ?? null,
        signature_url:  signatureUrl ?? null,
        issued_by:      dbUser.id,
        created_at:     now,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST id-issuance]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
