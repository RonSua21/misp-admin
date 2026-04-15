import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VoterStatus } from "@/types";

/**
 * PATCH /api/admin/applications/[id]/voter-status
 * Body: { voterStatus: VoterStatus }
 *
 * Allows admins to manually record/update the applicant's Makati voter status.
 * This must be ACTIVE before the application can be approved.
 */
export async function PATCH(
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

    const { voterStatus } = (await request.json()) as { voterStatus: VoterStatus };
    if (!voterStatus || !["ACTIVE", "INACTIVE", "UNKNOWN"].includes(voterStatus)) {
      return NextResponse.json(
        { error: "voterStatus must be ACTIVE, INACTIVE, or UNKNOWN." },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("applications")
      .update({ voter_status: voterStatus, updatedAt: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true, voterStatus });
  } catch (err) {
    console.error("[PATCH voter-status]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
