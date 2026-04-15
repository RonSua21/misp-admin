import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import TopBar from "@/components/layout/TopBar";
import DafacConfigClient from "@/components/disaster/DafacConfigClient";
import type { Metadata } from "next";
import type { Role } from "@/types";

export const metadata: Metadata = { title: "DAFAC Config — MISP Admin" };

export default async function DafacConfigPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createAdminClient();
  const { data: dbUser } = await db
    .from("users")
    .select("id, role")
    .eq("supabaseId", user.id)
    .single();
  if (!dbUser) redirect("/login");

  const { data: config } = await db
    .from("dafac_config")
    .select("id, tenurialStatus:tenurial_status, amount, updatedAt:updated_at")
    .order("amount", { ascending: false });

  return (
    <div>
      <TopBar
        title="DAFAC Assistance Configuration"
        subtitle="Manage fixed cash amounts per tenurial status"
      />
      <div className="p-6 max-w-3xl">
        <DafacConfigClient
          config={config ?? []}
          adminRole={dbUser.role as Role}
        />
      </div>
    </div>
  );
}
