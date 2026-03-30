import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/disaster/[id]/centers
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
    const { data, error } = await db
      .from("evacuation_centers")
      .select("*")
      .eq("disasterIncidentId", id)
      .order("createdAt", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/admin/disaster/[id]/centers]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/admin/disaster/[id]/centers — add evacuation center
export async function POST(
  request: Request,
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
      .select("role")
      .eq("supabaseId", user.id)
      .single();

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, barangay, capacity, contactPerson, contactNumber, latitude, longitude } = body;

    if (!name || !address || !barangay || !capacity) {
      return NextResponse.json({ error: "name, address, barangay, and capacity are required." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data, error } = await db
      .from("evacuation_centers")
      .insert({
        id:                  crypto.randomUUID(),
        disasterIncidentId:  id,
        name,
        address,
        barangay,
        capacity:            Number(capacity),
        currentHeadcount:    0,
        isOpen:              true,
        contactPerson:       contactPerson ?? null,
        contactNumber:       contactNumber ?? null,
        latitude:            latitude  ?? null,
        longitude:           longitude ?? null,
        createdAt:           now,
        updatedAt:           now,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/disaster/[id]/centers]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// PATCH /api/admin/disaster/[id]/centers — update headcount or status
// Body: { centerId, currentHeadcount?, isOpen? }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // id not needed for the update
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAdminClient();
    const body = await request.json();
    const { centerId, currentHeadcount, isOpen } = body;

    if (!centerId) {
      return NextResponse.json({ error: "centerId is required." }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (currentHeadcount !== undefined) updates.currentHeadcount = Number(currentHeadcount);
    if (isOpen !== undefined) updates.isOpen = Boolean(isOpen);

    const { data, error } = await db
      .from("evacuation_centers")
      .update(updates)
      .eq("id", centerId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/admin/disaster/[id]/centers]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
