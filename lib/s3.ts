import { S3Client } from "@aws-sdk/client-s3";

// S3-compatible client — points at MinIO in Docker Compose by default,
// swap to Cloudflare R2 (or any S3-compatible endpoint) via env vars alone.
// MinIO here is never reachable from the browser: it has no public route
// (no domain, no Caddy proxy), only this server-side client talks to it
// directly over the internal Docker network. All uploads/downloads are
// relayed through the app's own /api/uploads and /api/files/[...key] routes.
export const s3 = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true, // required for MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

export const S3_BUCKET = process.env.S3_BUCKET ?? "erasight-lms";

// App-relative URL the browser hits to view/download a material — proxied
// through /api/files/[...key], which streams the object from MinIO
// server-side. fileKey contains "/" (e.g. "materials/uuid-name.ext"), so each
// segment is encoded separately rather than encoding the whole key — the
// catch-all route expects one path segment per "/" in the key.
export function materialObjectUrl(fileKey: string) {
  return `/api/files/${fileKey.split("/").map(encodeURIComponent).join("/")}`;
}
