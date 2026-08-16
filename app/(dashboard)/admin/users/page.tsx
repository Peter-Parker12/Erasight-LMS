import { notFound } from "next/navigation";
import { Plus, Upload, BookOpen } from "lucide-react";
import { Role } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { toDateInputValue } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { BulkInviteDialog } from "@/components/admin/bulk-invite-dialog";
import { PendingInvitations } from "@/components/admin/pending-invitations";
import { ManageStudentClassesDialog } from "@/components/admin/manage-student-classes-dialog";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.ADMIN) notFound();

  const [users, invitationsRaw, allClassesRaw] = await Promise.all([
    db.user.findMany({
      orderBy: { name: "asc" },
      include: { enrollments: { select: { classId: true, accessExpiresAt: true } } },
    }),
    db.invitation.findMany({
      where: { acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      include: {
        classGrants: {
          include: { class: { include: { course: { select: { title: true } } } } },
        },
      },
    }),
    db.class.findMany({
      include: { course: { select: { title: true } } },
      orderBy: [{ course: { title: "asc" } }, { name: "asc" }],
    }),
  ]);

  const allClasses = allClassesRaw.map((c) => ({
    id: c.id,
    label: `${c.course.title} — ${c.name}`,
  }));

  const invitations = invitationsRaw.map((inv) => ({
    id: inv.id,
    email: inv.email,
    name: inv.name,
    role: inv.role,
    expiresAt: inv.expiresAt,
    classGrants: inv.classGrants.map((g) => ({
      id: g.id,
      className: `${g.class.course.title} — ${g.class.name}`,
      accessExpiresAt: g.accessExpiresAt,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <div className="flex items-center gap-2">
          <BulkInviteDialog
            trigger={
              <Button type="button" variant="outline">
                <Upload className="size-4" /> Bulk invite
              </Button>
            }
          />
          <InviteUserDialog
            classes={allClasses}
            trigger={
              <Button type="button">
                <Plus className="size-4" /> Invite user
              </Button>
            }
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.name}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <UserRoleSelect userId={u.id} role={u.role} disabled={u.id === user.id} />
              </TableCell>
              <TableCell>
                {u.role === Role.STUDENT && (
                  <ManageStudentClassesDialog
                    studentId={u.id}
                    studentName={u.name}
                    classes={allClasses}
                    currentGrants={u.enrollments.map((e) => ({
                      classId: e.classId,
                      accessExpiresAt: toDateInputValue(e.accessExpiresAt),
                    }))}
                    trigger={
                      <Button type="button" variant="ghost" size="icon" aria-label="Manage classes">
                        <BookOpen className="size-4" />
                      </Button>
                    }
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <PendingInvitations invitations={invitations} />
        </CardContent>
      </Card>
    </div>
  );
}
