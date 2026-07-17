import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { Role } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseDialog } from "@/components/course/course-dialog";

export default async function CoursesPage() {
  const user = await getCurrentUser();
  if (!user || !([Role.ADMIN, Role.INSTRUCTOR] as Role[]).includes(user.role)) notFound();

  const courses = await db.course.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { modules: true, classes: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Courses</h1>
        <CourseDialog
          trigger={
            <Button type="button">
              <Plus className="size-4" /> New course
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.length === 0 && (
          <p className="text-sm text-muted-foreground">No courses yet. Create the first one.</p>
        )}
        {courses.map((course) => (
          <Link key={course.id} href={`/courses/${course.id}`}>
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-base">{course.title}</CardTitle>
                <Badge variant={course.status === "PUBLISHED" ? "default" : "secondary"}>
                  {course.status}
                </Badge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {course._count.modules} modules · {course._count.classes} classes
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
