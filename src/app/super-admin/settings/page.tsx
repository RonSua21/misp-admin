import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import SettingsClient from "@/components/super-admin/SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createAdminClient();

  const [{ data: programs }, { data: announcements }] = await Promise.all([
    db
      .from("benefit_programs")
      .select("id, name, category, description, isActive, maxAmount")
      .order("name"),
    db
      .from("announcements")
      .select("id, title, body, isActive, createdAt")
      .order("createdAt", { ascending: false }),
  ]);

  return (
    <div>
      <TopBar
        title="Global Settings"
        subtitle="Manage benefit programs and system announcements"
      />
      <div className="p-6">
        <SettingsClient
          programs={programs ?? []}
          announcements={announcements ?? []}
        />
      </div>
    </div>
  );
}
