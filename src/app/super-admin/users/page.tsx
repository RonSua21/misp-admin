import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import UserManagementClient from "@/components/super-admin/UserManagementClient";

const MAKATI_BARANGAYS = [
  // District 1
  "Bangkal", "Bel-Air", "Carmona", "Dasmariñas", "Forbes Park",
  "Kasilawan", "La Paz", "Magallanes", "Olympia", "Palanan",
  "Pio del Pilar", "Poblacion", "San Antonio", "San Isidro", "San Lorenzo",
  "Santa Cruz", "Singkamas", "Tejeros", "Urdaneta", "Valenzuela",
  // District 2
  "Guadalupe Nuevo", "Guadalupe Viejo", "Pinagkaisahan",
];

export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createAdminClient();

  const { data: adminUsers } = await db
    .from("users")
    .select("id, firstName, lastName, email, role, barangay, createdAt, residencyVerified")
    .in("role", ["ADMIN", "SUPER_ADMIN"])
    .order("createdAt", { ascending: false });

  return (
    <div>
      <TopBar
        title="User Management"
        subtitle="Manage MSWD staff accounts and coordinator assignments"
      />
      <div className="p-6">
        <UserManagementClient
          users={adminUsers ?? []}
          barangays={MAKATI_BARANGAYS}
        />
      </div>
    </div>
  );
}
