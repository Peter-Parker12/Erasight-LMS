import { startOfMonth, subMonths, format } from "date-fns";

import { db } from "@/lib/db";
import { CourseStatus } from "@prisma/client";
import type { RecentMaterial } from "@/app/(dashboard)/_components/dashboard/recent-materials";

const TREND_MONTHS = 6;

function monthBuckets() {
  return Array.from({ length: TREND_MONTHS }, (_, i) => {
    const date = startOfMonth(subMonths(new Date(), TREND_MONTHS - 1 - i));
    return { date, label: format(date, "MMM") };
  });
}

function bucketByMonth(dates: Date[]) {
  const buckets = monthBuckets();
  return buckets.map(({ date, label }) => {
    const next = startOfMonth(subMonths(date, -1));
    const count = dates.filter((d) => d >= date && d < next).length;
    return { month: label, enrollments: count };
  });
}

function toRecentMaterials(
  materials: {
    id: string;
    title: string;
    type: RecentMaterial["type"];
    createdAt: Date;
    session: { module: { course: { id: string; title: string } } };
  }[]
): RecentMaterial[] {
  return materials.map((m) => ({
    id: m.id,
    title: m.title,
    type: m.type,
    createdAt: m.createdAt,
    courseId: m.session.module.course.id,
    courseTitle: m.session.module.course.title,
  }));
}

const recentMaterialsInclude = {
  session: { include: { module: { include: { course: { select: { id: true, title: true } } } } } },
} as const;

export async function getAdminDashboardData() {
  const [
    totalCourses,
    publishedCourses,
    draftCourses,
    totalClasses,
    totalStudents,
    totalEnrollments,
    enrollmentDates,
    classesByEnrollment,
    recentMaterialsRaw,
    storageUsed,
  ] = await Promise.all([
    db.course.count(),
    db.course.count({ where: { status: CourseStatus.PUBLISHED } }),
    db.course.count({ where: { status: CourseStatus.DRAFT } }),
    db.class.count(),
    db.user.count({ where: { role: "STUDENT" } }),
    db.enrollment.count(),
    db.enrollment.findMany({ select: { enrolledAt: true } }),
    db.class.findMany({
      include: { course: { select: { title: true } }, _count: { select: { enrollments: true } } },
      orderBy: { enrollments: { _count: "desc" } },
      take: 5,
    }),
    db.material.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: recentMaterialsInclude,
    }),
    db.material.aggregate({ _sum: { fileSize: true } }),
  ]);

  return {
    totalCourses,
    publishedCourses,
    draftCourses,
    totalClasses,
    totalStudents,
    totalEnrollments,
    enrollmentTrend: bucketByMonth(enrollmentDates.map((e) => e.enrolledAt)),
    topClasses: classesByEnrollment.map((c) => ({
      name: `${c.course.title} — ${c.name}`,
      enrollments: c._count.enrollments,
    })),
    recentMaterials: toRecentMaterials(recentMaterialsRaw),
    storageUsedBytes: storageUsed._sum.fileSize ?? 0,
  };
}

export async function getInstructorDashboardData(instructorId: string) {
  const classes = await db.class.findMany({
    where: { instructorId },
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { startDate: "asc" },
  });

  const courseIds = [...new Set(classes.map((c) => c.course.id))];
  const classIds = classes.map((c) => c.id);

  const [studentCount, enrollmentDates, materialsCount, recentMaterialsRaw, upcomingClasses] =
    await Promise.all([
      db.enrollment.findMany({
        where: { classId: { in: classIds } },
        distinct: ["studentId"],
        select: { studentId: true },
      }),
      db.enrollment.findMany({ where: { classId: { in: classIds } }, select: { enrolledAt: true } }),
      db.material.count({ where: { session: { module: { courseId: { in: courseIds } } } } }),
      db.material.findMany({
        where: { session: { module: { courseId: { in: courseIds } } } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: recentMaterialsInclude,
      }),
      classes.filter((c) => c.startDate && c.startDate >= new Date()).slice(0, 5),
    ]);

  return {
    totalClasses: classes.length,
    totalStudents: studentCount.length,
    materialsCount,
    enrollmentTrend: bucketByMonth(enrollmentDates.map((e) => e.enrolledAt)),
    topClasses: classes
      .sort((a, b) => b._count.enrollments - a._count.enrollments)
      .slice(0, 5)
      .map((c) => ({ name: `${c.course.title} — ${c.name}`, enrollments: c._count.enrollments })),
    recentMaterials: toRecentMaterials(recentMaterialsRaw),
    upcomingClasses: upcomingClasses.map((c) => ({
      id: c.id,
      name: c.name,
      courseTitle: c.course.title,
      startDate: c.startDate,
    })),
  };
}

export async function getStudentDashboardData(studentId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { studentId },
    include: { class: { include: { course: { select: { id: true, title: true } } } } },
    orderBy: { enrolledAt: "desc" },
  });

  const courseIds = [...new Set(enrollments.map((e) => e.class.course.id))];

  const recentMaterialsRaw = await db.material.findMany({
    where: { session: { module: { courseId: { in: courseIds } } } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: recentMaterialsInclude,
  });

  return {
    classes: enrollments.map((e) => ({
      enrollmentId: e.id,
      classId: e.class.id,
      className: e.class.name,
      courseTitle: e.class.course.title,
      status: e.status,
    })),
    recentMaterials: toRecentMaterials(recentMaterialsRaw),
  };
}
