import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/residents?q=searchTerm
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const { data } = await db
    .from("users")
    .select("id, firstName, lastName, email, contactNumber, barangay, voterStatus, tenurialStatus, isSenior, isPwd, isSoloParent, isPregnant, isIndigent, role")
    .or(`firstName.ilike.%${q}%,lastName.ilike.%${q}%,email.ilike.%${q}%,contactNumber.ilike.%${q}%`)
    .limit(10);

  return NextResponse.json(data ?? []);
}

// POST /api/admin/residents — create new or update existing resident profile
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as Record<string, any>;
  const { existingId, firstName, lastName, email } = body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "firstName, lastName, and email are required." }, { status: 400 });
  }

  const now = new Date().toISOString();

  const profileFields = {
    firstName:          body.firstName?.trim(),
    lastName:           body.lastName?.trim(),
    middleName:         body.middleName?.trim() || null,
    contactNumber:      body.phone?.trim() || null,
    dateOfBirth:        body.dateOfBirth || null,
    sex:                body.sex || null,
    civilStatus:        body.civilStatus || null,
    barangay:           body.barangay?.trim() || null,
    address:            body.address?.trim() || null,
    voterStatus:        body.voterStatus || "UNKNOWN",
    tenurialStatus:     body.tenurialStatus || null,
    yearsInMakati:      body.yearsInMakati ? Number(body.yearsInMakati) : null,
    isSenior:           !!body.isSenior,
    isPwd:              !!body.isPwd,
    isSoloParent:       !!body.isSoloParent,
    isPregnant:         !!body.isPregnant,
    isIndigent:         !!body.isIndigent,
    prpwdNumber:        body.prpwdNumber?.trim() || null,
    nrscNumber:         body.nrscNumber?.trim() || null,
    makatizenCardNumber: body.makatizenCardNumber?.trim() || null,
    updatedAt:          now,
  };

  // ── UPDATE existing resident ────────────────────────────────────────────
  if (existingId) {
    const { data, error } = await db
      .from("users")
      .update(profileFields)
      .eq("id", existingId)
      .select("id, firstName, lastName, email, barangay, voterStatus")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await upsertSectorProfiles(db, existingId, body, now);
    return NextResponse.json(data);
  }

  // ── CREATE new resident ─────────────────────────────────────────────────
  // Staff-created profiles don't get an auth account yet.
  // The resident can sign up via the portal later and will be matched by email.
  const { data: existing } = await db
    .from("users").select("id").eq("email", email.trim()).maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists. Search and select them instead." },
      { status: 409 }
    );
  }

  const newId = crypto.randomUUID();
  const { data, error } = await db.from("users").insert({
    id:          newId,
    supabaseId:  null,
    email:       email.trim(),
    role:        "REGISTERED_USER",
    isVerified:  false,
    createdAt:   now,
    ...profileFields,
  }).select("id, firstName, lastName, email, barangay, voterStatus").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await upsertSectorProfiles(db, newId, body, now);
  return NextResponse.json(data, { status: 201 });
}

async function upsertSectorProfiles(db: any, userId: string, body: Record<string, any>, now: string) {
  if (body.isPwd && body.disabilityType) {
    await db.from("pwd_profiles").upsert({
      userId,
      disabilityType:  body.disabilityType,
      disabilityCause: body.disabilityCause?.trim() || null,
      updatedAt:       now,
    }, { onConflict: "userId" });
  }

  if (body.isSenior) {
    await db.from("senior_profiles").upsert({
      userId,
      cardType:   body.cardType || null,
      isBedridden: !!body.isBedridden,
      updatedAt:  now,
    }, { onConflict: "userId" });
  }
}
