import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TenurialStatus } from "@/types";

/**
 * GET   /api/admin/dafac-config — returns all 4 tenurial status configs
 * PATCH /api/admin/dafac-config — updates the amount for a tenurial status (SUPER_ADMIN only)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAdminClient();
    const { data, error } = await db
      .from("dafac_config")
      .select("*")
      .order("tenurial_status");

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET dafac-config]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only SUPER_ADMIN can update DAFAC assistance amounts." },
        { status: 403 }
      );
    }

    const { tenurialStatus, amount } = (await request.json()) as {
      tenurialStatus: TenurialStatus;
      amount: number;
    };

    const validStatuses = ["OWNER", "RENTER", "SHARER", "BEDSPACER"];
    if (!tenurialStatus || !validStatuses.includes(tenurialStatus)) {
      return NextResponse.json(
        { error: "tenurialStatus must be OWNER, RENTER, SHARER, or BEDSPACER." },
        { status: 400 }
      );
    }
    if (typeof amount !== "number" || amount < 0) {
      return NextResponse.json({ error: "amount must be a non-negative number." }, { status: 400 });
    }

    const { data, error } = await db
      .from("dafac_config")
      .update({
        amount,
        updated_at: new Date().toISOString(),
        updated_by: dbUser.id,
      })
      .eq("tenurial_status", tenurialStatus)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH dafac-config]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
