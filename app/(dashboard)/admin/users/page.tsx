import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { Role } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
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
import { PendingInvitations } from "@/components/admin/pending-invitations";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.ADMIN) notFound();

  const [users, invitations] = await Promise.all([
    db.user.findMany({ orderBy: { name: "asc" } }),
    db.invitation.findMany({
      where: { acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <InviteUserDialog
          trigger={
            <Button type="button">
              <Plus className="size-4" /> Invite user
            </Button>
          }
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
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
