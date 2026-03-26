import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/disaster/[id]/evacuees — list all evacuees for this incident
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAdminClient();

    // Get all centers for this incident, then get their evacuees
    const { data: centers } = await db
      .from("evacuation_centers")
      .select("id")
      .eq("disasterIncidentId", id);

    if (!centers || centers.length === 0) return NextResponse.json([]);

    const centerIds = centers.map((c) => c.id);
    const { data, error } = await db
      .from("evacuees")
      .select("*, evacuation_centers(name, barangay)")
      .in("evacuationCenterId", centerIds)
      .order("registeredAt", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/admin/disaster/[id]/evacuees]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/admin/disaster/[id]/evacuees — register an evacuee
// Body: { evacuationCenterId, name, age?, barangay?, headCount? }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAdminClient();
    const body = await request.json();
    const { evacuationCenterId, name, age, barangay, headCount = 1 } = body;

    if (!evacuationCenterId || !name) {
      return NextResponse.json({ error: "evacuationCenterId and name are required." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data, error } = await db
      .from("evacuees")
      .insert({
        id:                  crypto.randomUUID(),
        evacuationCenterId,
        name,
        age:                 age       ?? null,
        barangay:            barangay  ?? null,
        headCount:           Number(headCount),
        registeredAt:        now,
      })
      .select()
      .single();

    if (error) throw error;

    // Update the center's headcount
    const { data: center } = await db
      .from("evacuation_centers")
      .select("currentHeadcount")
      .eq("id", evacuationCenterId)
      .single();

    if (center) {
      await db
        .from("evacuation_centers")
        .update({
          currentHeadcount: (center.currentHeadcount ?? 0) + Number(headCount),
          updatedAt: now,
        })
        .eq("id", evacuationCenterId);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/disaster/[id]/evacuees]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
