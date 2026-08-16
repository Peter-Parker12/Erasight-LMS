// Shared predicate for whether a class enrollment still grants access —
// used by both the page-level gate (app/(dashboard)/classes/[classId]) and
// the file-download route (app/api/files/[...key]) so "expired" means the
// same thing everywhere.
export function isEnrollmentActive(enrollment: { accessExpiresAt: Date | null }) {
  return !enrollment.accessExpiresAt || enrollment.accessExpiresAt > new Date();
}
