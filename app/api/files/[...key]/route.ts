import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Role } from "@prisma/client";

import { requireUser, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";
import { isEnrollmentActive } from "@/lib/access";
import { s3, S3_BUCKET } from "@/lib/s3";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const { key } = await params;
  const fileKey = key.join("/");

  const material = await db.material.findUnique({
    where: { fileKey },
    include: {
      session: {
        include: {
          module: {
            include: {
              course: {
                include: {
                  classes: {
                    include: { enrollments: { where: { studentId: user.id } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!material) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const classes = material.session.module.course.classes;
  const hasAccess =
    user.role === Role.ADMIN ||
    (user.role === Role.INSTRUCTOR && classes.some((c) => c.instructorId === user.id)) ||
    (user.role === Role.STUDENT &&
      classes.some((c) => c.enrollments.some((e) => isEnrollmentActive(e))));

  if (!hasAccess) {
    return NextResponse.json({ error: "You don't have access to this file." }, { status: 403 });
  }

  let object;
  try {
    object = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: fileKey }));
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  if (!object.Body) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const stream = await object.Body.transformToWebStream();

  return new Response(stream, {
    headers: {
      "Content-Type": object.ContentType ?? "application/octet-stream",
      ...(object.ContentLength != null ? { "Content-Length": String(object.ContentLength) } : {}),
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
