import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { Role } from "@prisma/client";

import { requireRole, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const classes = await db.class.findMany({
    include: { course: { select: { title: true } } },
    orderBy: [{ course: { title: "asc" } }, { name: "asc" }],
  });

  const workbook = XLSX.utils.book_new();

  const invitationsSheet = XLSX.utils.json_to_sheet([
    {
      Name: "Jane Doe",
      Email: "jane@example.com",
      Class: classes[0] ? `${classes[0].course.title} — ${classes[0].name}` : "Intro to Design — Cohort A",
      "Expiration Date": "2026-12-01",
    },
  ]);
  XLSX.utils.book_append_sheet(workbook, invitationsSheet, "Invitations");

  const classesSheet = XLSX.utils.json_to_sheet(
    classes.map((c) => ({ Class: `${c.course.title} — ${c.name}` }))
  );
  XLSX.utils.book_append_sheet(workbook, classesSheet, "Classes");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="invitation-template.xlsx"',
    },
  });
}
