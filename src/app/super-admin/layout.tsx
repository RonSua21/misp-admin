import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Sidebar from "@/components/layout/Sidebar";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createAdminClient();
  const { data: dbUser } = await db
    .from("users")
    .select("firstName, lastName, email, role, barangay")
    .eq("supabaseId", user.id)
    .single();

  if (!dbUser || dbUser.role !== "SUPER_ADMIN") redirect("/admin");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar
        userName={`${dbUser.firstName} ${dbUser.lastName}`}
        userEmail={dbUser.email}
        role={dbUser.role}
        barangay={null}
      />
      <main className="md:ml-16 pt-14 md:pt-0 min-h-screen">{children}</main>
    </div>
  );
}
