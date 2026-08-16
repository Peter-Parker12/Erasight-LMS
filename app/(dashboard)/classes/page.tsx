import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Role } from "@prisma/client";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isEnrollmentActive } from "@/lib/access";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassDialog } from "@/components/class/class-dialog";

export default async function ClassesPage() {
  const user = await requireUser();

  const where =
    user.role === Role.ADMIN
      ? {}
      : user.role === Role.INSTRUCTOR
        ? { instructorId: user.id }
        : { enrollments: { some: { studentId: user.id } } };

  const classes = await db.class.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { id: true, title: true } },
      instructor: { select: { name: true } },
      _count: { select: { enrollments: true } },
      enrollments: { where: { studentId: user.id }, select: { accessExpiresAt: true } },
    },
  });

  const [courses, instructors] =
    user.role === Role.ADMIN
      ? await Promise.all([
          db.course.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
          db.user.findMany({
            where: { role: { in: [Role.ADMIN, Role.INSTRUCTOR] } },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          }),
        ])
      : [[], []];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Classes</h1>
        {user.role === Role.ADMIN && courses.length > 0 && (
          <ClassDialog
            courses={courses}
            instructors={instructors}
            trigger={
              <Button type="button">
                <Plus className="size-4" /> New class
              </Button>
            }
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {user.role === Role.STUDENT ? "You're not enrolled in any classes yet." : "No classes yet."}
          </p>
        )}
        {classes.map((klass) => (
          <Link key={klass.id} href={`/classes/${klass.id}`}>
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-base">{klass.name}</CardTitle>
                {user.role === Role.STUDENT &&
                  klass.enrollments[0] &&
                  !isEnrollmentActive(klass.enrollments[0]) && (
                    <Badge variant="destructive">Access expired</Badge>
                  )}
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{klass.course.title}</p>
                {klass.instructor && <p>Instructor: {klass.instructor.name}</p>}
                <p>{klass._count.enrollments} students</p>
                {klass.startDate && <p>Starts {format(klass.startDate, "MMM d, yyyy")}</p>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
