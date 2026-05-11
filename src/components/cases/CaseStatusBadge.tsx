import type { CaseStatus } from "@/types";

const STATUS_STYLES: Record<CaseStatus, string> = {
  OPEN:        "bg-gray-100 text-gray-700",
  ACTIVE:      "bg-blue-100 text-blue-800",
  FOR_CLOSURE: "bg-yellow-100 text-yellow-800",
  CLOSED:      "bg-green-100 text-green-800",
  REFERRED:    "bg-purple-100 text-purple-800",
};

export default function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}
