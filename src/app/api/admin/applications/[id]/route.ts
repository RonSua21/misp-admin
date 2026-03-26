import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = createAdminClient();
    const { data: dbUser } = await db
      .from("users")
      .select("id, role, barangay")
      .eq("supabaseId", user.id)
      .single();

    if (
      !dbUser ||
      (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status, remarks, amountApproved } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required." },
        { status: 400 }
      );
    }

    // Fetch current application
    const { data: currentApp } = await db
      .from("applications")
      .select("status, applicantBarangay")
      .eq("id", id)
      .single();

    if (!currentApp) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    // Coordinator can only update their barangay's apps
    if (
      dbUser.role === "ADMIN" &&
      dbUser.barangay &&
      currentApp.applicantBarangay !== dbUser.barangay
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update application
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (remarks !== undefined) updateData.remarks = remarks;
    if (amountApproved !== undefined) updateData.amountApproved = amountApproved;

    const { error: updateError } = await db
      .from("applications")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Insert audit log
    await db.from("application_status_history").insert({
      applicationId: id,
      fromStatus: currentApp.status,
      toStatus: status,
      changedBy: dbUser.id,
      remarks: remarks ?? null,
      changedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/admin/applications/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
