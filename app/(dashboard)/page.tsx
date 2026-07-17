import { Suspense } from "react";
import { Role } from "@prisma/client";

import { requireUser } from "@/lib/auth";
import { AdminDashboard } from "./_components/dashboard/admin-dashboard";
import { InstructorDashboard } from "./_components/dashboard/instructor-dashboard";
import { StudentDashboard } from "./_components/dashboard/student-dashboard";
import { DashboardSkeleton } from "./_components/dashboard/dashboard-skeleton";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        {user.role === Role.ADMIN && <AdminDashboard />}
        {user.role === Role.INSTRUCTOR && <InstructorDashboard instructorId={user.id} />}
        {user.role === Role.STUDENT && <StudentDashboard studentId={user.id} />}
      </Suspense>
    </div>
  );
}
