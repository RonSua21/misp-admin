import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file   = formData.get("file") as File | null;
  const label  = formData.get("label") as string | null;
  const userId = formData.get("userId") as string | null;

  if (!file || !userId || !label) {
    return NextResponse.json({ error: "file, userId, and label are required." }, { status: 400 });
  }

  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const slug = label.replace(/\s+/g, "-").toLowerCase();
  const path = `applications/${userId}/${Date.now()}-${slug}.${ext}`;

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error: uploadError } = await db.storage
    .from("application-documents")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = db.storage
    .from("application-documents")
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl, path });
}
