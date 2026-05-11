import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { AutoPrint } from "@/components/disaster/AutoPrint";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Evacuation List — Print" };

export default async function PrintEvacuationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ center?: string }>;
}) {
  const { id } = await params;
  const { center: centerId } = await searchParams;
  const db = createAdminClient();

  const [{ data: incident }, { data: allCenters }] = await Promise.all([
    db.from("disaster_incidents").select("id, title, type, barangay, reportedAt").eq("id", id).single(),
    db.from("evacuation_centers")
      .select("id, name, address, barangay, capacity, currentHeadcount, evacuees(*)")
      .eq("disasterIncidentId", id)
      .order("createdAt", { ascending: true }),
  ]);

  if (!incident) notFound();

  const centers = centerId
    ? (allCenters ?? []).filter((c) => c.id === centerId)
    : (allCenters ?? []);

  const printedAt = new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <>
      <AutoPrint />
      <div className="font-sans text-gray-900 bg-white min-h-screen p-8 print:p-6">

        {/* MSWD Header */}
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Republic of the Philippines</p>
            <p className="text-xs text-gray-500">City of Makati</p>
            <h1 className="text-xl font-extrabold text-gray-900 mt-1">
              Makati Social Welfare Department
            </h1>
            <p className="text-sm text-gray-600">MSWD Integrated Services Portal</p>
          </div>
          <div className="text-right text-xs text-gray-500 space-y-0.5">
            <p>Date Printed: {printedAt}</p>
            <p>Incident: <span className="font-semibold">{incident.type}</span></p>
            {incident.barangay && <p>Primarily Affected: Brgy. {incident.barangay}</p>}
          </div>
        </div>

        <h2 className="text-lg font-extrabold text-center mb-1">{incident.title}</h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          Reported: {new Date(incident.reportedAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        {centers.length === 0 && (
          <p className="text-center text-gray-500">No evacuation centers found.</p>
        )}

        {centers.map((center) => {
          const evacuees = (center.evacuees ?? []) as {
            id: string; name: string; age?: number; barangay?: string;
            headCount: number; registeredAt: string;
          }[];

          return (
            <div key={center.id} className="mb-10 break-inside-avoid">
              {/* Center header */}
              <div className="bg-gray-100 px-4 py-2 rounded mb-2 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{center.name}</p>
                  <p className="text-xs text-gray-600">{center.address}, Brgy. {center.barangay}</p>
                </div>
                <div className="text-right text-xs text-gray-600">
                  <p>Capacity: {center.capacity}</p>
                  <p>Current Headcount: <span className="font-bold">{center.currentHeadcount}</span></p>
                </div>
              </div>

              {evacuees.length === 0 ? (
                <p className="text-sm text-gray-400 italic px-2">No evacuees registered at this center.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border border-gray-200">
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600 w-8">#</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600">Name</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600 w-12">Age</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600">Home Barangay</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600 w-16">Family</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600">Check-in Time</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600 w-28">Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evacuees.map((ev, idx) => (
                      <tr key={ev.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border border-gray-200 px-3 py-2 text-center text-gray-500">{idx + 1}</td>
                        <td className="border border-gray-200 px-3 py-2 font-medium">{ev.name}</td>
                        <td className="border border-gray-200 px-3 py-2 text-center text-gray-600">{ev.age ?? "—"}</td>
                        <td className="border border-gray-200 px-3 py-2 text-gray-600">{ev.barangay ?? "—"}</td>
                        <td className="border border-gray-200 px-3 py-2 text-center text-gray-600">{ev.headCount}</td>
                        <td className="border border-gray-200 px-3 py-2 text-gray-600 whitespace-nowrap text-xs">
                          {new Date(ev.registeredAt).toLocaleString("en-PH", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="border border-gray-200 px-3 py-2">&nbsp;</td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-gray-100 font-semibold">
                      <td className="border border-gray-200 px-3 py-2 text-right text-xs text-gray-600" colSpan={4}>Total Persons:</td>
                      <td className="border border-gray-200 px-3 py-2 text-center">
                        {evacuees.reduce((s, e) => s + e.headCount, 0)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2" colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          );
        })}

        {/* Footer */}
        <div className="mt-12 border-t border-gray-300 pt-4 text-xs text-gray-500 text-center print:fixed print:bottom-4 print:left-0 print:right-0">
          This document is an official record of the Makati Social Welfare Department.
          Generated by MISP — {printedAt}
        </div>
      </div>
    </>
  );
}
