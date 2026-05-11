import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import TopBar from "@/components/layout/TopBar";
import IntakeWizard from "@/components/intake/IntakeWizard";

export default async function IntakePage() {
  const dbUser = await getAdminUser();
  if (!dbUser) redirect("/login?error=unauthorized");

  const db = createAdminClient();
  const { data: incidents } = await db
    .from("disaster_incidents")
    .select("id, title, type")
    .eq("status", "ACTIVE")
    .order("reportedAt", { ascending: false });

  return (
    <div>
      <TopBar
        title="Intake & Application"
        subtitle="Register a new resident or submit an application on their behalf."
      />
      <div className="p-6 max-w-4xl mx-auto">
        <IntakeWizard activeIncidents={incidents ?? []} />
      </div>
    </div>
  );
}
