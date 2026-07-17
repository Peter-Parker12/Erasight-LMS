import { S3Client } from "@aws-sdk/client-s3";

// S3-compatible client — points at MinIO in Docker Compose by default,
// swap to Cloudflare R2 (or any S3-compatible endpoint) via env vars alone.
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

// Public base URL used to build viewable/downloadable links for stored objects
// (e.g. a MinIO subdomain, or the R2 public bucket URL).
export const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL ?? process.env.S3_ENDPOINT ?? "";

export function materialObjectUrl(fileKey: string) {
  return `${S3_PUBLIC_URL.replace(/\/$/, "")}/${S3_BUCKET}/${fileKey}`;
}
