import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET  /api/admin/disaster/[id]/vouchers — list vouchers for this incident
 * POST /api/admin/disaster/[id]/vouchers — issue a voucher to an evacuee
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

    // Get all center IDs for this incident
    const { data: centers } = await db
      .from("evacuation_centers")
      .select("id")
      .eq("disasterIncidentId", id);

    if (!centers?.length) return NextResponse.json([]);

    const centerIds = centers.map((c) => c.id);

    // Get evacuee IDs for these centers
    const { data: evacuees } = await db
      .from("evacuees")
      .select("id")
      .in("evacuationCenterId", centerIds);

    if (!evacuees?.length) return NextResponse.json([]);

    const evacueeIds = evacuees.map((e) => e.id);

    const { data, error } = await db
      .from("relief_vouchers")
      .select("*, evacuees(id, name, dafac_number), relief_inventory(itemName, unit)")
      .in("evacuee_id", evacueeIds)
      .order("issued_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET vouchers]", err);
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

    const { evacueeId, inventoryId, quantity = 1 } = await request.json();
    if (!evacueeId || !inventoryId) {
      return NextResponse.json({ error: "evacueeId and inventoryId are required." }, { status: 400 });
    }

    // ── Verify evacuee belongs to this incident ───────────────────────
    const { data: centers } = await db
      .from("evacuation_centers")
      .select("id")
      .eq("disasterIncidentId", id);

    if (!centers?.length) {
      return NextResponse.json({ error: "No evacuation centers for this incident." }, { status: 422 });
    }

    const centerIds = centers.map((c) => c.id);
    const { data: evacuee } = await db
      .from("evacuees")
      .select("id")
      .eq("id", evacueeId)
      .in("evacuationCenterId", centerIds)
      .single();

    if (!evacuee) {
      return NextResponse.json(
        { error: "Evacuee does not belong to this incident." },
        { status: 422 }
      );
    }

    // ── Check stock availability ──────────────────────────────────────
    const { data: item } = await db
      .from("relief_inventory")
      .select("quantityAvailable, quantityDistributed, unit")
      .eq("id", inventoryId)
      .single();

    if (!item) return NextResponse.json({ error: "Inventory item not found." }, { status: 404 });

    const remaining = (item.quantityAvailable ?? 0) - (item.quantityDistributed ?? 0);
    if (remaining < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${remaining} ${item.unit}.` },
        { status: 422 }
      );
    }

    // ── Generate unique voucher code ──────────────────────────────────
    const prefix      = id.slice(0, 6).toUpperCase();
    const suffix      = crypto.randomUUID().slice(0, 6).toUpperCase();
    const voucherCode = `VCH-${prefix}-${suffix}`;

    const now = new Date().toISOString();
    const { data: voucher, error } = await db
      .from("relief_vouchers")
      .insert({
        id:           crypto.randomUUID(),
        voucher_code: voucherCode,
        evacuee_id:   evacueeId,
        inventory_id: inventoryId,
        quantity:     Number(quantity),
        redeemed:     false,
        issued_at:    now,
        issued_by:    dbUser.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(voucher, { status: 201 });
  } catch (err) {
    console.error("[POST vouchers]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
