import { notFound } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { MaterialType, Role } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { materialObjectUrl } from "@/lib/s3";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseDialog } from "@/components/course/course-dialog";
import { ModuleDialog } from "@/components/course/module-dialog";
import { ModuleSection } from "@/components/course/module-section";
import { DeleteCourseButton } from "@/components/course/delete-course-button";
import type { MaterialWithUrl } from "@/components/course/material-item";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !([Role.ADMIN, Role.INSTRUCTOR] as Role[]).includes(user.role)) notFound();

  const { courseId } = await params;

  const course = await db.course.findUnique({
    where: { id: courseId },
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
  });

  if (!course) notFound();

  const modules = course.modules.map((courseModule) => ({
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
            material.type === MaterialType.VIDEO || material.type === MaterialType.DOCUMENT
              ? material.fileKey
                ? materialObjectUrl(material.fileKey)
                : null
              : null,
        })
      ),
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{course.title}</h1>
            <Badge variant={course.status === "PUBLISHED" ? "default" : "secondary"}>
              {course.status}
            </Badge>
          </div>
          {course.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{course.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <CourseDialog
            course={course}
            trigger={
              <Button type="button" variant="outline" size="icon" aria-label="Edit course">
                <Pencil className="size-4" />
              </Button>
            }
          />
          <DeleteCourseButton courseId={course.id} title={course.title} />
        </div>
      </div>

      <div className="space-y-4">
        {modules.map((courseModule) => (
          <ModuleSection key={courseModule.id} module={courseModule} />
        ))}
        <ModuleDialog
          courseId={course.id}
          trigger={
            <Button type="button" variant="outline">
              <Plus className="size-4" /> Add module
            </Button>
          }
        />
      </div>
    </div>
  );
}
