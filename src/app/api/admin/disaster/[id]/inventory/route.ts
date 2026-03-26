import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/disaster/[id]/inventory
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
      .from("relief_inventory")
      .select("*")
      .eq("disasterIncidentId", id)
      .order("createdAt", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/admin/disaster/[id]/inventory]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/admin/disaster/[id]/inventory — add item
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
    const body = await request.json();
    const { itemName, unit, quantityAvailable, barangay, notes } = body;

    if (!itemName || !unit || quantityAvailable === undefined) {
      return NextResponse.json({ error: "itemName, unit, and quantityAvailable are required." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data, error } = await db
      .from("relief_inventory")
      .insert({
        id:                  crypto.randomUUID(),
        disasterIncidentId:  id,
        itemName,
        unit,
        quantityAvailable:   Number(quantityAvailable),
        quantityDistributed: 0,
        barangay:            barangay ?? null,
        notes:               notes    ?? null,
        createdAt:           now,
        updatedAt:           now,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/disaster/[id]/inventory]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// PATCH /api/admin/disaster/[id]/inventory — update distributed qty
// Body: { itemId, quantityDistributed }
export async function PATCH(
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
    const { itemId, quantityDistributed } = body;

    if (!itemId || quantityDistributed === undefined) {
      return NextResponse.json({ error: "itemId and quantityDistributed are required." }, { status: 400 });
    }

    const { data, error } = await db
      .from("relief_inventory")
      .update({
        quantityDistributed: Number(quantityDistributed),
        updatedAt: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/admin/disaster/[id]/inventory]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
