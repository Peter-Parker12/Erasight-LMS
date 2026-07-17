import { BookOpen, GraduationCap, Users, Layers } from "lucide-react";

import { getAdminDashboardData } from "@/lib/dashboard";
import { KpiTile } from "./kpi-tile";
import { EnrollmentTrendChart } from "./enrollment-trend-chart";
import { TopCoursesChart } from "./top-courses-chart";
import { RecentMaterials } from "./recent-materials";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export async function AdminDashboard() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label="Courses"
          value={`${data.publishedCourses} / ${data.totalCourses}`}
          icon={BookOpen}
        />
        <KpiTile label="Active classes" value={data.totalClasses} icon={Layers} />
        <KpiTile label="Students" value={data.totalStudents} icon={GraduationCap} />
        <KpiTile label="Enrollments" value={data.totalEnrollments} icon={Users} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EnrollmentTrendChart data={data.enrollmentTrend} />
        <TopCoursesChart data={data.topClasses} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentMaterials materials={data.recentMaterials} />
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Storage used: </span>
          {formatBytes(data.storageUsedBytes)}
          <br />
          <span className="font-medium text-foreground">Draft courses: </span>
          {data.draftCourses}
        </div>
      </div>
    </div>
  );
}
