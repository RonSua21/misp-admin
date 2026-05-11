import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
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
      .select("id, role")
      .eq("supabaseId", user.id)
      .single();

    if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: bodyText, isActive } = body;

    if (!title || !bodyText) {
      return NextResponse.json(
        { error: "Title and body are required." },
        { status: 400 }
      );
    }

    const { error: insertError } = await db.from("announcements").insert({
      title,
      body: bodyText,
      isActive: isActive ?? true,
      createdBy: dbUser.id,
      createdAt: new Date().toISOString(),
    });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/super-admin/announcements]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
