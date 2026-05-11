import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: raw } = await db
    .from("case_notes")
    .select(`*, author:users!case_notes_authorId_fkey(firstName, lastName)`)
    .eq("caseId", id)
    .order("createdAt", { ascending: false });

  const notes = (raw ?? []).map((n: any) => ({
    ...n,
    authorName: `${n.author?.firstName ?? ""} ${n.author?.lastName ?? ""}`.trim(),
    author: undefined,
  }));
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { content, type } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content is required." }, { status: 400 });

  const { data, error } = await db
    .from("case_notes")
    .insert({ caseId: id, content: content.trim(), type: type ?? "UPDATE", authorId: dbUser.id })
    .select("id, caseId, content, type, authorId, createdAt")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update the case's updatedAt
  await db.from("cases").update({ updatedAt: new Date().toISOString() }).eq("id", id);

  return NextResponse.json(data, { status: 201 });
}
