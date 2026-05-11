import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PATCH /api/admin/disaster/vouchers/[code]/redeem
 *
 * Redeems a voucher by its code (from a QR scan or manual entry).
 * Increments the inventory's quantityDistributed on redemption.
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
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

    // Fetch voucher
    const { data: voucher } = await db
      .from("relief_vouchers")
      .select("id, redeemed, inventory_id, quantity")
      .eq("voucher_code", code)
      .single();

    if (!voucher) {
      return NextResponse.json({ error: "Voucher not found." }, { status: 404 });
    }
    if (voucher.redeemed) {
      return NextResponse.json({ error: "This voucher has already been redeemed." }, { status: 422 });
    }

    const now = new Date().toISOString();

    // Mark as redeemed
    const { error: voucherError } = await db
      .from("relief_vouchers")
      .update({ redeemed: true, redeemed_at: now, redeemed_by: dbUser.id })
      .eq("id", voucher.id);

    if (voucherError) throw voucherError;

    // Increment distributed quantity on inventory
    const { data: item } = await db
      .from("relief_inventory")
      .select("quantityDistributed")
      .eq("id", voucher.inventory_id)
      .single();

    if (item) {
      await db
        .from("relief_inventory")
        .update({
          quantityDistributed: (item.quantityDistributed ?? 0) + voucher.quantity,
          updatedAt: now,
        })
        .eq("id", voucher.inventory_id);
    }

    return NextResponse.json({ success: true, redeemedAt: now });
  } catch (err) {
    console.error("[PATCH redeem]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
