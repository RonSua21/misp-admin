import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET  /api/admin/disaster/[id]/payroll — list payroll batches for this incident
 * POST /api/admin/disaster/[id]/payroll — generate a new payroll batch from eligible evacuees
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
      .from("payroll_batches")
      .select("*, payroll_items(*, evacuees(id, name, dafac_number, barangay, tenurial_status))")
      .eq("incident_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET payroll]", err);
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

    await request.json(); // consume body (disburseMethod can be set per-item later)

    // ── 1. Get all evacuation centers for this incident ───────────────
    const { data: centers } = await db
      .from("evacuation_centers")
      .select("id")
      .eq("disasterIncidentId", id);

    if (!centers?.length) {
      return NextResponse.json(
        { error: "No evacuation centers found for this incident." },
        { status: 422 }
      );
    }

    const centerIds = centers.map((c) => c.id);

    // ── 2. Get eligible evacuees (must have tenurial_status + assistance_amount) ─
    const { data: eligible } = await db
      .from("evacuees")
      .select("id, assistance_amount, name")
      .in("evacuationCenterId", centerIds)
      .not("tenurial_status", "is", null)
      .not("assistance_amount", "is", null)
      .eq("disbursed", false);

    if (!eligible?.length) {
      return NextResponse.json(
        { error: "No eligible undisbursed evacuees with tenurial status found." },
        { status: 422 }
      );
    }

    // ── 3. Exclude evacuees already in an active (non-REJECTED) batch ─
    const { data: existingItems } = await db
      .from("payroll_items")
      .select("evacuee_id, payroll_batches(status)")
      .in("evacuee_id", eligible.map((e) => e.id));

    const alreadyInBatch = new Set(
      (existingItems ?? [])
        .filter((item) => {
          const batch = Array.isArray(item.payroll_batches)
            ? item.payroll_batches[0]
            : item.payroll_batches;
          return batch?.status !== "REJECTED";
        })
        .map((item) => item.evacuee_id)
    );

    const toInclude = eligible.filter((e) => !alreadyInBatch.has(e.id));

    if (!toInclude.length) {
      return NextResponse.json(
        { error: "All eligible evacuees are already included in an active payroll batch." },
        { status: 422 }
      );
    }

    // ── 4. Create batch ───────────────────────────────────────────────
    const totalAmount = toInclude.reduce((sum, e) => sum + (e.assistance_amount ?? 0), 0);
    const year        = new Date().getFullYear();
    const seq         = String(Date.now()).slice(-6);
    const batchNumber = `PAY-${year}-${seq}`;
    const now         = new Date().toISOString();

    const { data: batch, error: batchError } = await db
      .from("payroll_batches")
      .insert({
        id:           crypto.randomUUID(),
        incident_id:  id,
        batch_number: batchNumber,
        status:       "DRAFT",
        total_amount: totalAmount,
        created_by:   dbUser.id,
        created_at:   now,
        updated_at:   now,
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // ── 5. Bulk insert payroll items ──────────────────────────────────
    const items = toInclude.map((e) => ({
      id:              crypto.randomUUID(),
      batch_id:        batch.id,
      evacuee_id:      e.id,
      amount:          e.assistance_amount,
      disburse_method: "CASH",
      created_at:      now,
    }));

    const { error: itemsError } = await db.from("payroll_items").insert(items);
    if (itemsError) throw itemsError;

    return NextResponse.json(
      { batch, itemCount: items.length, totalAmount },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST payroll]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
