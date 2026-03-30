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
      .select("role")
      .eq("supabaseId", user.id)
      .single();

    if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, firstName, lastName, barangay, role } = body;

    if (!email || !password || !firstName || !lastName || !barangay) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Sign up the user via Supabase auth
    const { data: authData, error: signUpError } =
      await supabase.auth.admin
        ? // Try admin API first (won't work with anon key, fallback below)
          { data: null, error: new Error("no_admin") }
        : { data: null, error: new Error("no_admin") };

    // Since we don't have service_role key, use signUp which sends confirmation email
    const { data: signUpData, error: authError } =
      await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { firstName, lastName },
        },
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUserId = signUpData.user?.id;
    if (!newUserId) {
      return NextResponse.json(
        { error: "Failed to create auth user." },
        { status: 500 }
      );
    }

    // Insert into users table
    const { error: insertError } = await db.from("users").insert({
      supabaseId: newUserId,
      email: email.trim().toLowerCase(),
      firstName,
      lastName,
      role: role ?? "ADMIN",
      barangay,
      residencyVerified: true,
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
    console.error("[POST /api/super-admin/users]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
