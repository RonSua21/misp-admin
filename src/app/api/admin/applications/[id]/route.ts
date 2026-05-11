import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import type { RejectionCode } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────

const REJECTION_MESSAGES: Record<string, string> = {
  VOTER_INACTIVE:       "voter registration is inactive",
  INCOMPLETE_DOCS:      "required documents are missing or invalid",
  NOT_ELIGIBLE:         "applicant does not meet eligibility requirements",
  ORIENTATION_REQUIRED: "orientation seminar attendance is required",
  FAILED_HOME_VISIT:    "home visitation assessment was not completed",
  OTHER:                "please contact the MSWD office for details",
};

function rejectionCodeToMessage(code: string): string {
  return REJECTION_MESSAGES[code] ?? REJECTION_MESSAGES.OTHER;
}

/**
 * PATCH /api/admin/applications/[id]
 *
 * Replaces the old free-form status update with a multi-level approval chain:
 *   approval_level 0 → MAC Coordinator (ADMIN or SUPER_ADMIN)
 *   approval_level 1 → MSWD Head (SUPER_ADMIN)
 *   approval_level 2 → Mayor's Office (SUPER_ADMIN)
 *
 * Body: {
 *   action: "approve" | "return",
 *   rejectionCode?: RejectionCode,
 *   remarks?: string,
 *   orientationAttended?: boolean,  // only relevant at level 0→1 for SENIOR_CITIZEN
 * }
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
      .select("id, role, barangay")
      .eq("supabaseId", user.id)
      .single();

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      action,
      rejectionCode,
      remarks,
      orientationAttended,
    } = body as {
      action: "approve" | "return";
      rejectionCode?: RejectionCode;
      remarks?: string;
      orientationAttended?: boolean;
    };

    if (!action || !["approve", "return"].includes(action)) {
      return NextResponse.json({ error: "action must be 'approve' or 'return'." }, { status: 400 });
    }

    // ── Load current application ──────────────────────────────────────
    const { data: app } = await db
      .from("applications")
      .select(
        "id, referenceNumber, status, approval_level, voter_status, orientation_attended, " +
        "applicantBarangay, userId, benefitProgramId, benefit_programs(category, name, maxAmount)"
      )
      .eq("id", id)
      .single() as { data: any };

    if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });

    const level = (app.approval_level ?? 0) as number;

    // ── Coordinator can only touch their barangay's apps ──────────────
    if (
      dbUser.role === "ADMIN" &&
      dbUser.barangay &&
      app.applicantBarangay !== dbUser.barangay
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Only ADMIN can act at level 0; SUPER_ADMIN for levels 1 and 2 ─
    if (level === 0 && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only a MAC Coordinator can act at this stage." }, { status: 403 });
    }
    if ((level === 1 || level === 2) && dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only SUPER_ADMIN can act at this approval stage." }, { status: 403 });
    }
    if (level >= 3) {
      return NextResponse.json({ error: "Application is already fully approved." }, { status: 422 });
    }

    const now = new Date().toISOString();

    // ── RETURN (reject) ───────────────────────────────────────────────
    if (action === "return") {
      const code = rejectionCode ?? "OTHER";

      await db.from("applications").update({
        status:          "REJECTED",
        rejection_code:  code,
        remarks:         remarks ?? null,
        updatedAt:       now,
      }).eq("id", id);

      await db.from("application_status_history").insert({
        applicationId:  id,
        fromStatus:     app.status,
        toStatus:       "REJECTED",
        changedBy:      dbUser.id,
        remarks:        remarks ?? `Returned at level ${level}: ${rejectionCodeToMessage(code)}`,
        approvalLevel:  level,
        rejectionCode:  code,
        changedAt:      now,
      });

      // Notify the applicant
      createNotification({
        userId:  app.userId,
        title:   "Application Update",
        message: `Your application ${app.referenceNumber} could not proceed — ${rejectionCodeToMessage(code)}. Please contact the MSWD office.`,
        type:    "APPLICATION_UPDATE",
      }).catch(() => {});

      return NextResponse.json({ success: true, newStatus: "REJECTED", newLevel: level });
    }

    // ── APPROVE ───────────────────────────────────────────────────────

    // Voter status must be ACTIVE for any approval
    if (app.voter_status !== "ACTIVE") {
      return NextResponse.json(
        { error: "The applicant's voter status must be ACTIVE before approving." },
        { status: 422 }
      );
    }

    // Blue Card / Senior Citizen: orientation required at level 0→1 transition
    const program = Array.isArray(app.benefit_programs)
      ? app.benefit_programs[0]
      : app.benefit_programs;
    const isSeniorProgram = program?.category === "SENIOR_CITIZEN";

    if (level === 0 && isSeniorProgram) {
      const attended = orientationAttended ?? app.orientation_attended ?? false;
      if (!attended) {
        return NextResponse.json(
          { error: "Applicant must attend the Orientation Seminar before MAC Coordinator approval." },
          { status: 422 }
        );
      }
    }

    // ── Determine next state ──────────────────────────────────────────
    let newLevel    = level + 1;
    let newStatus   = "UNDER_REVIEW";
    const updateData: Record<string, unknown> = {
      approval_level: newLevel,
      updatedAt:      now,
    };

    if (level === 0) {
      updateData.mac_approved_at = now;
      updateData.mac_approved_by = dbUser.id;
      if (orientationAttended !== undefined) updateData.orientation_attended = orientationAttended;
    } else if (level === 1) {
      updateData.mswd_approved_at = now;
      updateData.mswd_approved_by = dbUser.id;
    } else if (level === 2) {
      // Final approval by Mayor's Office
      newStatus = "APPROVED";
      updateData.mayor_approved_at = now;
      updateData.mayor_approved_by = dbUser.id;
      updateData.status            = "APPROVED";
      // Assign standard benefit amount from program
      if (program?.maxAmount) {
        updateData.amountApproved = program.maxAmount;
      }
    }

    if (newStatus !== "APPROVED") {
      updateData.status = "UNDER_REVIEW";
    }

    await db.from("applications").update(updateData).eq("id", id);

    // ── Insert status history entry ───────────────────────────────────
    await db.from("application_status_history").insert({
      applicationId: id,
      fromStatus:    app.status,
      toStatus:      newStatus,
      changedBy:     dbUser.id,
      remarks:       remarks ?? null,
      approvalLevel: newLevel,
      changedAt:     now,
    });

    // ── If fully approved, auto-create MEDICINE booklet issuance record ─
    if (level === 2) {
      await db.from("id_issuances").insert({
        id:             crypto.randomUUID(),
        application_id: id,
        user_id:        app.userId,
        booklet_type:   "MEDICINE",
        issued_by:      dbUser.id,
        created_at:     now,
      });
    }

    // ── Notify the applicant ──────────────────────────────────────────
    const approvalMessages = [
      `Your application ${app.referenceNumber} passed MAC Coordinator review and is now with the MSWD Head.`,
      `Your application ${app.referenceNumber} passed MSWD Head review and is now with the Mayor's Office.`,
      `Your application ${app.referenceNumber} has been fully approved! Please visit the MSWD office to claim your benefit.`,
    ];

    createNotification({
      userId:  app.userId,
      title:   "Application Update",
      message: approvalMessages[level] ?? `Your application ${app.referenceNumber} has been updated.`,
      type:    "APPLICATION_UPDATE",
    }).catch(() => {});

    return NextResponse.json({ success: true, newStatus, newLevel });
  } catch (err) {
    console.error("[PATCH /api/admin/applications/[id]]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
