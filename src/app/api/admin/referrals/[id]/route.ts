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

  const [{ data: ref }, { data: notes }] = await Promise.all([
    db.from("referrals")
      .select(`*, client:users!referrals_clientId_fkey(firstName, lastName, barangay, email, phone), referrer:users!referrals_referredBy_fkey(firstName, lastName), case:cases!referrals_caseId_fkey(caseNumber)`)
      .eq("id", id)
      .single(),
    db.from("referral_notes")
      .select(`*, author:users!referral_notes_authorId_fkey(firstName, lastName)`)
      .eq("referralId", id)
      .order("createdAt", { ascending: false }),
  ]);

  if (!ref) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...ref,
    clientName: `${ref.client?.firstName ?? ""} ${ref.client?.lastName ?? ""}`.trim(),
    clientBarangay: ref.client?.barangay,
    clientEmail: ref.client?.email,
    clientPhone: ref.client?.phone,
    referredByName: `${ref.referrer?.firstName ?? ""} ${ref.referrer?.lastName ?? ""}`.trim(),
    caseNumber: ref.case?.caseNumber ?? null,
    client: undefined, referrer: undefined, case: undefined,
    notes: (notes ?? []).map((n: any) => ({
      ...n,
      authorName: `${n.author?.firstName ?? ""} ${n.author?.lastName ?? ""}`.trim(),
      author: undefined,
    })),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: dbUser } = await db.from("users").select("id, role").eq("supabaseId", user.id).single();
  if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status, outcome, responseDate } = await req.json();
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (status)       update.status       = status;
  if (outcome)      update.outcome      = outcome;
  if (responseDate) update.responseDate = responseDate;

  const { error } = await db.from("referrals").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
