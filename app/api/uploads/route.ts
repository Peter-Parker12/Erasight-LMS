import { randomUUID } from "crypto";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { Upload } from "@aws-sdk/lib-storage";
import { z } from "zod";
import { Role } from "@prisma/client";

import { requireRole, UnauthorizedError } from "@/lib/auth";
import { s3, S3_BUCKET } from "@/lib/s3";

// Soft safety cap on course material size. Best-effort: relies on the
// browser-set Content-Length header (present for File/Blob request bodies),
// not enforced if the header is missing.
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

const querySchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
});

// Receives the file body directly and relays it to MinIO server-side —
// MinIO has no public route, so uploads can't go straight from the browser
// to storage the way a presigned-URL flow would.
export async function PUT(req: Request) {
  try {
    await requireRole(Role.ADMIN, Role.INSTRUCTOR);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    fileName: url.searchParams.get("fileName"),
    fileType: url.searchParams.get("fileType"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!req.body) {
    return NextResponse.json({ error: "No file body." }, { status: 400 });
  }

  const contentLength = req.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is too large." }, { status: 413 });
  }

  const { fileName, fileType } = parsed.data;
  const fileKey = `materials/${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  try {
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: S3_BUCKET,
        Key: fileKey,
        Body: Readable.fromWeb(req.body as import("node:stream/web").ReadableStream<Uint8Array>),
        ContentType: fileType,
      },
    });
    await upload.done();
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  return NextResponse.json({ fileKey });
}
