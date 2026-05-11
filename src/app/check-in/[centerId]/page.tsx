import { createAdminClient } from "@/lib/supabase/admin";
import { CheckInForm } from "@/components/disaster/CheckInForm";
import { MapPin, Users, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Evacuee Check-in — MSWD" };

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ centerId: string }>;
}) {
  const { centerId } = await params;
  const db = createAdminClient();

  const { data: center } = await db
    .from("evacuation_centers")
    .select("id, name, address, barangay, capacity, currentHeadcount, isOpen, disasterIncidentId")
    .eq("id", centerId)
    .single();

  const isFull = center
    ? (center.currentHeadcount ?? 0) >= (center.capacity ?? 0)
    : false;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-makati-blue flex items-center justify-center shrink-0">
          <span className="text-white font-extrabold text-sm">M</span>
        </div>
        <div>
          <p className="font-bold text-makati-blue text-sm leading-tight">MSWD</p>
          <p className="text-xs text-gray-500 leading-tight">Makati Social Welfare Department</p>
        </div>
      </div>

      <div className="w-full max-w-sm">
        {!center ? (
          <div className="card p-6 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="font-semibold text-gray-800">Relief center not found.</p>
            <p className="text-sm text-gray-500">This QR code may be invalid or expired.</p>
          </div>
        ) : !center.isOpen ? (
          <div className="card p-6 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="font-semibold text-gray-800">This center is closed.</p>
            <p className="text-sm text-gray-500">Check-ins are no longer being accepted at {center.name}.</p>
          </div>
        ) : isFull ? (
          <div className="card p-6 text-center space-y-3">
            <Users className="w-8 h-8 text-red-500 mx-auto" />
            <p className="font-semibold text-gray-800">This center is at full capacity.</p>
            <p className="text-sm text-gray-500">
              {center.name} has reached its maximum capacity of {center.capacity}.
              Please proceed to another relief center.
            </p>
          </div>
        ) : (
          <div className="card p-6 space-y-5">
            {/* Center info */}
            <div>
              <h1 className="text-lg font-extrabold text-gray-900">{center.name}</h1>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {center.address}, Brgy. {center.barangay}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">OPEN</span>
                <span className="text-xs text-gray-500">
                  {center.currentHeadcount} / {center.capacity} occupants
                </span>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <p className="text-sm font-bold text-gray-900 mb-4">Evacuee Check-in</p>
              <CheckInForm centerId={centerId} />
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Makati Social Welfare Department
        </p>
      </div>
    </div>
  );
}
