import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { z } from "zod";
import { Role } from "@prisma/client";

import { requireRole, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";
import { createInvitationRecord, type ClassGrantInput } from "@/lib/invitations";
import { ActionError } from "@/lib/safe-action";

const REQUIRED_HEADERS = ["Name", "Email", "Class", "Expiration Date"] as const;
const MAX_ROWS = 2000;

type Row = { Name: unknown; Email: unknown; Class: unknown; "Expiration Date": unknown };

type SkippedEntry = { row: number | null; email: string | null; reason: string };

function parseDateCell(value: unknown): { ok: true; date: Date | null } | { ok: false } {
  if (value === "" || value === null || value === undefined) return { ok: true, date: null };
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? { ok: false } : { ok: true, date: value };
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? { ok: false } : { ok: true, date: parsed };
  }
  return { ok: false };
}

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireRole(Role.ADMIN);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  let rows: Row[];
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
  } catch {
    return NextResponse.json({ error: "Could not read this file as an Excel spreadsheet." }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "The spreadsheet has no data rows." }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Too many rows (max ${MAX_ROWS}).` }, { status: 400 });
  }
  const headers = Object.keys(rows[0]);
  if (!REQUIRED_HEADERS.every((h) => headers.includes(h))) {
    return NextResponse.json(
      { error: `Expected columns: ${REQUIRED_HEADERS.join(", ")}.` },
      { status: 400 }
    );
  }

  const classes = await db.class.findMany({
    include: { course: { select: { title: true } } },
  });
  const classLookup = new Map(
    classes.map((c) => [`${c.course.title} — ${c.name}`.toLowerCase().trim(), c.id])
  );

  const emailSchema = z.string().email();
  const skipped: SkippedEntry[] = [];
  const validByEmail = new Map<string, { name: string; classGrants: ClassGrantInput[] }>();

  rows.forEach((row, i) => {
    const rowNumber = i + 2; // +1 for 0-index, +1 for header row
    const name = String(row.Name ?? "").trim();
    const emailRaw = String(row.Email ?? "").trim();
    const classRaw = String(row.Class ?? "").trim();

    if (!name) {
      skipped.push({ row: rowNumber, email: null, reason: "Name is required." });
      return;
    }
    const emailResult = emailSchema.safeParse(emailRaw.toLowerCase());
    if (!emailResult.success) {
      skipped.push({ row: rowNumber, email: emailRaw || null, reason: "Invalid email." });
      return;
    }
    const email = emailResult.data;

    const classId = classLookup.get(classRaw.toLowerCase());
    if (!classId) {
      skipped.push({
        row: rowNumber,
        email,
        reason: `Class '${classRaw}' not found. Use the exact value from the template's Classes sheet.`,
      });
      return;
    }

    const dateResult = parseDateCell(row["Expiration Date"]);
    if (!dateResult.ok) {
      skipped.push({ row: rowNumber, email, reason: "Invalid expiration date." });
      return;
    }

    const existingStudent = validByEmail.get(email);
    if (existingStudent) {
      if (existingStudent.name !== name) {
        skipped.push({
          row: rowNumber,
          email,
          reason: `Name '${name}' differs from an earlier row for this email — using the latest.`,
        });
        existingStudent.name = name;
      }
      const existingGrant = existingStudent.classGrants.find((g) => g.classId === classId);
      if (existingGrant) {
        skipped.push({
          row: rowNumber,
          email,
          reason: `Class '${classRaw}' was already granted to this email in an earlier row — using the latest expiration date.`,
        });
        existingGrant.accessExpiresAt = dateResult.date;
      } else {
        existingStudent.classGrants.push({ classId, accessExpiresAt: dateResult.date });
      }
    } else {
      validByEmail.set(email, { name, classGrants: [{ classId, accessExpiresAt: dateResult.date }] });
    }
  });

  const created: { email: string; name: string; classCount: number }[] = [];

  for (const [email, { name, classGrants }] of validByEmail) {
    try {
      await createInvitationRecord({
        email,
        name,
        role: Role.STUDENT,
        classGrants,
        invitedById: admin.id,
        invitedByName: admin.name ?? "An administrator",
      });
      created.push({ email, name, classCount: classGrants.length });
    } catch (e) {
      const reason = e instanceof ActionError ? e.message : "Failed to create invitation.";
      skipped.push({ row: null, email, reason });
    }
  }

  revalidatePath("/admin/users");

  return NextResponse.json({
    totalRows: rows.length,
    createdCount: created.length,
    created,
    skipped,
  });
}
