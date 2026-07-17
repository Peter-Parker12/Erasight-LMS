import { format } from "date-fns";
import { Layers, GraduationCap, FileText } from "lucide-react";

import { getInstructorDashboardData } from "@/lib/dashboard";
import { KpiTile } from "./kpi-tile";
import { EnrollmentTrendChart } from "./enrollment-trend-chart";
import { TopCoursesChart } from "./top-courses-chart";
import { RecentMaterials } from "./recent-materials";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function InstructorDashboard({ instructorId }: { instructorId: string }) {
  const data = await getInstructorDashboardData(instructorId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="My classes" value={data.totalClasses} icon={Layers} />
        <KpiTile label="Students" value={data.totalStudents} icon={GraduationCap} />
        <KpiTile label="Materials" value={data.materialsCount} icon={FileText} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EnrollmentTrendChart data={data.enrollmentTrend} />
        <TopCoursesChart data={data.topClasses} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentMaterials materials={data.recentMaterials} />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Upcoming classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.upcomingClasses.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming classes.</p>
            )}
            {data.upcomingClasses.map((c) => (
              <div key={c.id} className="flex justify-between text-sm">
                <span>
                  {c.courseTitle} — {c.name}
                </span>
                <span className="text-muted-foreground">
                  {c.startDate ? format(c.startDate, "MMM d, yyyy") : "—"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
