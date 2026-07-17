import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Pencil, UserPlus } from "lucide-react";
import { MaterialType, Role } from "@prisma/client";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { materialObjectUrl } from "@/lib/s3";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassDialog } from "@/components/class/class-dialog";
import { DeleteClassButton } from "@/components/class/delete-class-button";
import { Roster } from "@/components/class/roster";
import { EnrollStudentDialog } from "@/components/class/enroll-student-dialog";
import { CurriculumView } from "@/components/class/curriculum-view";
import type { MaterialWithUrl } from "@/components/course/material-item";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const user = await requireUser();
  const { classId } = await params;

  const klass = await db.class.findUnique({
    where: { id: classId },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              sessions: {
                orderBy: { order: "asc" },
                include: { materials: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
      instructor: { select: { name: true } },
      enrollments: {
        orderBy: { enrolledAt: "asc" },
        include: { student: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!klass) notFound();

  const isAdmin = user.role === Role.ADMIN;
  const isOwningInstructor = user.role === Role.INSTRUCTOR && klass.instructorId === user.id;
  const isEnrolledStudent =
    user.role === Role.STUDENT && klass.enrollments.some((e) => e.studentId === user.id);

  if (!isAdmin && !isOwningInstructor && !isEnrolledStudent) notFound();

  const canManageRoster = isAdmin;
  const canSeeRoster = isAdmin || isOwningInstructor;

  const [availableStudents, instructors] = await Promise.all([
    canManageRoster
      ? db.user.findMany({
          where: {
            role: Role.STUDENT,
            id: { notIn: klass.enrollments.map((e) => e.studentId) },
          },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    isAdmin
      ? db.user.findMany({
          where: { role: { in: [Role.ADMIN, Role.INSTRUCTOR] } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const modules = klass.course.modules.map((courseModule) => ({
    id: courseModule.id,
    title: courseModule.title,
    sessions: courseModule.sessions.map((session) => ({
      id: session.id,
      title: session.title,
      description: session.description,
      materials: session.materials.map(
        (material): MaterialWithUrl => ({
          id: material.id,
          title: material.title,
          type: material.type,
          url: material.url,
          content: material.content,
          fileUrl:
            (material.type === MaterialType.VIDEO || material.type === MaterialType.DOCUMENT) &&
            material.fileKey
              ? materialObjectUrl(material.fileKey)
              : null,
        })
      ),
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{klass.name}</h1>
          <p className="text-sm text-muted-foreground">{klass.course.title}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {klass.instructor && <span>Instructor: {klass.instructor.name}</span>}
            {klass.startDate && <span>Starts {format(klass.startDate, "MMM d, yyyy")}</span>}
            {klass.endDate && <span>Ends {format(klass.endDate, "MMM d, yyyy")}</span>}
          </div>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 items-center gap-1">
            <ClassDialog
              klass={klass}
              instructors={instructors}
              trigger={
                <Button type="button" variant="outline" size="icon" aria-label="Edit class">
                  <Pencil className="size-4" />
                </Button>
              }
            />
            <DeleteClassButton classId={klass.id} name={klass.name} />
          </div>
        )}
      </div>

      {canSeeRoster && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              Roster <Badge variant="secondary">{klass.enrollments.length}</Badge>
            </CardTitle>
            {canManageRoster && (
              <EnrollStudentDialog
                classId={klass.id}
                availableStudents={availableStudents}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    <UserPlus className="size-4" /> Enroll student
                  </Button>
                }
              />
            )}
          </CardHeader>
          <CardContent>
            <Roster
              canManage={canManageRoster}
              entries={klass.enrollments.map((e) => ({
                enrollmentId: e.id,
                name: e.student.name,
                email: e.student.email,
                status: e.status,
              }))}
            />
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-medium">Course content</h2>
        <CurriculumView modules={modules} />
      </div>
    </div>
  );
}
