import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content is required." }, { status: 400 });

  const { data, error } = await db
    .from("referral_notes")
    .insert({ referralId: id, content: content.trim(), authorId: dbUser.id })
    .select("id, referralId, content, authorId, createdAt")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("referrals").update({ updatedAt: new Date().toISOString() }).eq("id", id);
  return NextResponse.json(data, { status: 201 });
}
