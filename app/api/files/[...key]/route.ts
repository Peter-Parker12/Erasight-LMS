import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";

import { requireUser, UnauthorizedError } from "@/lib/auth";
import { s3, S3_BUCKET } from "@/lib/s3";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  try {
    await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const { key } = await params;
  const fileKey = key.join("/");

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
