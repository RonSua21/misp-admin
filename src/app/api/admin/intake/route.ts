import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/notifications";

const TYPE_PREFIX: Record<string, string> = {
  PWD_ID:             "PWD",
  SENIOR_WHITE_CARD:  "SWC",
  SENIOR_BLUE_CARD:   "SBC",
  AICS:               "AICS",
  CALAMITY_RELIEF:    "CAL",
};

async function generateReferenceNumber(db: any, type: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = TYPE_PREFIX[type] ?? "APP";
  const { count } = await db
    .from("applications")
    .select("id", { count: "exact", head: true })
    .like("referenceNumber", `${prefix}-${year}-%`);
  const seq = String((count ?? 0) + 1).padStart(6, "0");
  return `${prefix}-${year}-${seq}`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db
    .from("users").select("id, role, barangay").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as Record<string, any>;
  const { userId, type, documents = [] } = body;

  if (!userId || !type) {
    return NextResponse.json({ error: "userId and type are required." }, { status: 400 });
  }

  const validTypes = ["PWD_ID", "SENIOR_WHITE_CARD", "SENIOR_BLUE_CARD", "AICS", "CALAMITY_RELIEF"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid application type." }, { status: 400 });
  }

  // Verify resident exists
  const { data: resident } = await db
    .from("users").select("id, firstName, lastName, email").eq("id", userId).single();
  if (!resident) return NextResponse.json({ error: "Resident not found." }, { status: 404 });

  // AICS requires a category
  if (type === "AICS" && !body.aicsCategory) {
    return NextResponse.json({ error: "aicsCategory is required for AICS applications." }, { status: 400 });
  }

  // Calamity requires an active incident
  if (type === "CALAMITY_RELIEF" && !body.disasterIncidentId) {
    return NextResponse.json({ error: "disasterIncidentId is required for Calamity Relief." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const appId = crypto.randomUUID();
  const referenceNumber = await generateReferenceNumber(db, type);

  const { data: app, error: appError } = await db.from("applications").insert({
    id:                  appId,
    referenceNumber,
    userId,
    type,
    status:              "PENDING",
    applicantBarangay:   body.applicantBarangay?.trim() || null,
    voterStatus:         body.voterStatus || null,
    tenurialStatus:      body.tenurialStatus || null,
    approvalLevel:       0,
    aicsCategory:        body.aicsCategory || null,
    amountRequested:     body.amountRequested ? Number(body.amountRequested) : null,
    disasterIncidentId:  body.disasterIncidentId || null,
    notes:               body.notes?.trim() || null,
    createdAt:           now,
    updatedAt:           now,
  }).select("id, referenceNumber").single();

  if (appError) return NextResponse.json({ error: appError.message }, { status: 500 });

  // Initial status history entry
  await db.from("application_status_history").insert({
    applicationId: appId,
    fromStatus:    null,
    toStatus:      "PENDING",
    changedBy:     dbUser.id,
    changedAt:     now,
    remarks:       `Intake by staff — type: ${type}`,
  });

  // Attach documents
  if (documents.length > 0) {
    await db.from("application_documents").insert(
      documents.map((doc: any) => ({
        applicationId: appId,
        label:         doc.label,
        fileUrl:       doc.fileUrl,
        fileType:      doc.fileType || null,
        uploadedBy:    dbUser.id,
        uploadedAt:    now,
      }))
    );
  }

  // Update sector-specific profile flags
  if (type === "PWD_ID") {
    await db.from("pwd_profiles").upsert({
      userId,
      prpwdEncoded:          !!body.prpwdEncoded,
      homeDeliveryRequired:  !!body.homeDeliveryRequired,
      homeDeliveryAddress:   body.homeDeliveryAddress?.trim() || null,
      updatedAt:             now,
    }, { onConflict: "userId" });
  }

  if (type === "SENIOR_BLUE_CARD" && body.orientationAttended !== undefined) {
    await db.from("senior_profiles").upsert({
      userId,
      orientationAttended: !!body.orientationAttended,
      orientationDate:     body.orientationAttended ? now : null,
      updatedAt:           now,
    }, { onConflict: "userId" });
  }

  notifyAdmins({
    title:   "New Application Submitted",
    message: `${type.replace(/_/g, " ")} application ${referenceNumber} submitted for ${resident.firstName} ${resident.lastName}.`,
    type:    "APPLICATION_UPDATE",
  }).catch(() => {});

  return NextResponse.json({ id: appId, referenceNumber }, { status: 201 });
}
