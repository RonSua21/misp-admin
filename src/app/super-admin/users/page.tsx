import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import UserManagementClient from "@/components/super-admin/UserManagementClient";

const MAKATI_BARANGAYS = [
<<<<<<< HEAD
  "Bangkal", "Bel-Air", "Carmona", "Dasmariñas", "Forbes Park",
  "Guadalupe Nuevo", "Guadalupe Viejo", "Kasilawan", "La Paz",
  "Magallanes", "Olympia", "Palanan", "Pinagkaisahan", "Pio del Pilar",
  "Poblacion", "San Antonio", "San Isidro", "San Lorenzo", "Santa Cruz",
  "Singkamas", "Tejeros", "Urdaneta", "Valenzuela",
=======
  "Bangkal", "Bel-Air", "Carmona", "Cembo", "Comembo", "Dasmariñas",
  "East Rembo", "Forbes Park", "Guadalupe Nuevo", "Guadalupe Viejo",
  "Hagdang Bato Itaas", "Hagdang Bato Libis", "Hippodromo", "Hulo",
  "Iba", "Illaya", "Kasilawan", "La Paz", "Laging Handa", "Magallanes",
  "Maharlika", "Malamig", "Manggahan", "Mapayapa Village", "Marcelo Green",
  "Mauway", "Nagpayong", "Olympia", "Palanan", "Pamplona", "Pampang",
  "Pansol", "Peñafrancia", "Pio Del Pilar", "Pitogo", "Plainview",
  "Post Proper Northside", "Post Proper Southside", "Potrero", "Rizal",
  "San Antonio", "San Isidro", "San Lorenzo", "Santa Cruz", "Singkamas",
  "South Cembo", "Tejeros", "Tuktukan", "Urdaneta", "Valenzuela",
  "West Rembo", "Pembo",
>>>>>>> bef4d8a5281193e96a09571df5a3ff91bed1874a
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
