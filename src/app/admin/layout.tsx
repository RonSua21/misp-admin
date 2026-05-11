import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth-cache";
import Sidebar from "@/components/layout/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dbUser = await getAdminUser();

  if (
    !dbUser ||
    (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")
  ) {
    redirect("/login?error=unauthorized");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar
        userName={`${dbUser.firstName} ${dbUser.lastName}`}
        userEmail={dbUser.email}
        role={dbUser.role}
        barangay={dbUser.barangay ?? null}
      />
      <main className="md:ml-16 pt-14 md:pt-0 min-h-screen">{children}</main>
    </div>
  );
}
