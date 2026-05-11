export function rejectionCodeToMessage(code: string): string {
  const map: Record<string, string> = {
    VOTER_INACTIVE:       "voter registration is inactive",
    INCOMPLETE_DOCS:      "required documents are missing or invalid",
    NOT_ELIGIBLE:         "applicant does not meet eligibility requirements",
    ORIENTATION_REQUIRED: "orientation seminar attendance is required",
    FAILED_HOME_VISIT:    "home visitation assessment was not completed",
    OTHER:                "please contact MSWD for details",
  };
  return map[code] ?? "please contact MSWD for details";
}
