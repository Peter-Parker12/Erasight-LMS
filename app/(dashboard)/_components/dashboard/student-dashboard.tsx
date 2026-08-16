import Link from "next/link";

import { getStudentDashboardData } from "@/lib/dashboard";
import { isEnrollmentActive } from "@/lib/access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecentMaterials } from "./recent-materials";

export async function StudentDashboard({ studentId }: { studentId: string }) {
  const data = await getStudentDashboardData(studentId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">My classes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.classes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              You&apos;re not enrolled in any classes yet.
            </p>
          )}
          {data.classes.map((c) => (
            <Link
              key={c.enrollmentId}
              href={`/classes/${c.classId}`}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <span>
                {c.courseTitle} — {c.className}
              </span>
              <span className="flex gap-1.5">
                <Badge variant="secondary">{c.status}</Badge>
                {c.accessExpiresAt && !isEnrollmentActive(c) && (
                  <Badge variant="destructive">Access expired</Badge>
                )}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <RecentMaterials materials={data.recentMaterials} />
    </div>
  );
}
