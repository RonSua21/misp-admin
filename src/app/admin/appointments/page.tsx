import { getAdminUser } from "@/lib/auth-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import AppointmentsTable from "@/components/appointments/AppointmentsTable";
import WalkInButton from "@/components/appointments/WalkInButton";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; status?: string }>;
}) {
  const params = await searchParams;
  const dbUser = await getAdminUser();
  if (!dbUser) redirect("/login");

  const today  = new Date().toISOString().slice(0, 10);
  const date   = params.date ?? today;
  const status = params.status ?? "";

  const db = createAdminClient();
  let q = db
    .from("appointments")
    .select(
      `id, userId, serviceType, preferredDate, preferredTime, status, notes, isWalkIn, queueNumber, assignedTo, confirmedAt, completedAt, cancelledAt, createdAt,
       users!appointments_userId_fkey(firstName, lastName)`,
      { count: "exact" }
    )
    .eq("preferredDate", date)
    .order("preferredTime", { ascending: true });

  if (status) q = q.eq("status", status);

  const { data: raw, count } = await q;

  const appointments = (raw ?? []).map((a: any) => ({
    ...a,
    clientName: `${a.users?.firstName ?? ""} ${a.users?.lastName ?? ""}`.trim() || null,
    users: undefined,
  }));

  return (
    <div>
      <TopBar title="Appointments" subtitle="Manage online bookings and walk-in queue" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <WalkInButton />
        </div>
        <AppointmentsTable
          appointments={appointments}
          total={count ?? 0}
          currentDate={date}
          currentStatus={status}
        />
      </div>
    </div>
  );
}
