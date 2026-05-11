import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PATCH /api/admin/disaster/[id]/payroll/[batchId]/approve
 *
 * Advances a payroll batch through the 3-level approval chain.
 *
 * Body: { action: "submit" | "approve" | "return", rejectionReason?: string }
 *
 * Transitions:
 *   submit : DRAFT           → PENDING_MAC    (any ADMIN/SUPER_ADMIN)
 *   approve: PENDING_MAC     → PENDING_MSWD   (any ADMIN/SUPER_ADMIN)
 *            PENDING_MSWD    → PENDING_MAYOR  (SUPER_ADMIN)
 *            PENDING_MAYOR   → APPROVED       (SUPER_ADMIN)
 *            APPROVED        → DISBURSED      (SUPER_ADMIN — marks all items disbursed)
 *   return : any             → REJECTED       (any ADMIN/SUPER_ADMIN)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; batchId: string }> }
) {
  try {
    const { batchId } = await params;
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

    const { action, rejectionReason } = (await request.json()) as {
      action: "submit" | "approve" | "return";
      rejectionReason?: string;
    };

    const { data: batch } = await db
      .from("payroll_batches")
      .select("status")
      .eq("id", batchId)
      .single();

    if (!batch) return NextResponse.json({ error: "Payroll batch not found." }, { status: 404 });

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { updated_at: now };

    if (action === "return") {
      updateData.status            = "REJECTED";
      updateData.rejection_reason  = rejectionReason ?? null;
    } else if (action === "submit" && batch.status === "DRAFT") {
      updateData.status = "PENDING_MAC";
    } else if (action === "approve") {
      const transitions: Record<string, string> = {
        PENDING_MAC:   "PENDING_MSWD",
        PENDING_MSWD:  "PENDING_MAYOR",
        PENDING_MAYOR: "APPROVED",
        APPROVED:      "DISBURSED",
      };

      // Higher levels require SUPER_ADMIN
      if (
        (batch.status === "PENDING_MSWD" || batch.status === "PENDING_MAYOR" || batch.status === "APPROVED") &&
        dbUser.role !== "SUPER_ADMIN"
      ) {
        return NextResponse.json(
          { error: "Only SUPER_ADMIN can approve at this level." },
          { status: 403 }
        );
      }

      const nextStatus = transitions[batch.status];
      if (!nextStatus) {
        return NextResponse.json(
          { error: `Cannot approve from status ${batch.status}.` },
          { status: 422 }
        );
      }

      updateData.status = nextStatus;

      // Record who approved at each level
      if (batch.status === "PENDING_MAC") {
        updateData.mac_approved_at = now;
        updateData.mac_approved_by = dbUser.id;
      } else if (batch.status === "PENDING_MSWD") {
        updateData.mswd_approved_at = now;
        updateData.mswd_approved_by = dbUser.id;
      } else if (batch.status === "PENDING_MAYOR") {
        updateData.mayor_approved_at = now;
        updateData.mayor_approved_by = dbUser.id;
      } else if (batch.status === "APPROVED") {
        // Final disbursement — record on batch and all items
        updateData.disbursed_at = now;
        await db
          .from("payroll_items")
          .update({ disbursed_at: now })
          .eq("batch_id", batchId);
        // Mark evacuees as disbursed
        const { data: items } = await db
          .from("payroll_items")
          .select("evacuee_id")
          .eq("batch_id", batchId);
        if (items?.length) {
          await db
            .from("evacuees")
            .update({ disbursed: true, disbursed_at: now })
            .in("id", items.map((i) => i.evacuee_id));
        }
      }
    } else {
      return NextResponse.json(
        { error: "Invalid action or batch is in a non-actionable state." },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("payroll_batches")
      .update(updateData)
      .eq("id", batchId);

    if (error) throw error;
    return NextResponse.json({ success: true, newStatus: updateData.status });
  } catch (err) {
    console.error("[PATCH payroll approve]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
