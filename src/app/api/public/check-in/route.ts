import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { centerId, name, age, barangay, headCount = 1 } = body;

    if (!centerId || !name?.trim()) {
      return NextResponse.json({ error: "Center and name are required." }, { status: 400 });
    }

    const db = createAdminClient();

    // Verify center exists and is open
    const { data: center } = await db
      .from("evacuation_centers")
      .select("id, isOpen, currentHeadcount, capacity")
      .eq("id", centerId)
      .single();

    if (!center) {
      return NextResponse.json({ error: "Relief center not found." }, { status: 404 });
    }
    if (!center.isOpen) {
      return NextResponse.json({ error: "This center is not accepting check-ins." }, { status: 403 });
    }

    // Insert evacuee
    const { error: insertError } = await db.from("evacuees").insert({
      evacuationCenterId: centerId,
      name: name.trim(),
      age: age ? Number(age) : null,
      barangay: barangay || null,
      headCount: Number(headCount) || 1,
      registeredAt: new Date().toISOString(),
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Increment center headcount
    await db
      .from("evacuation_centers")
      .update({ currentHeadcount: (center.currentHeadcount ?? 0) + (Number(headCount) || 1) })
      .eq("id", centerId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
