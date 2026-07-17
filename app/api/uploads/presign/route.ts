import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { Role } from "@prisma/client";

import { requireRole, UnauthorizedError } from "@/lib/auth";
import { s3, S3_BUCKET, materialObjectUrl } from "@/lib/s3";

const bodySchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    await requireRole(Role.ADMIN, Role.INSTRUCTOR);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { fileName, fileType } = parsed.data;
  const fileKey = `materials/${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: fileKey,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return NextResponse.json({
    uploadUrl,
    fileKey,
    fileUrl: materialObjectUrl(fileKey),
  });
}
