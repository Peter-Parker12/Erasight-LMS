"use client";

import { format } from "date-fns";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { XCircle } from "lucide-react";

import { revokeInvitation } from "@/actions/invitations";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type PendingInvitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
};

export function PendingInvitations({ invitations }: { invitations: PendingInvitation[] }) {
  const { execute } = useAction(revokeInvitation, {
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to revoke invitation."),
  });

  if (invitations.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending invitations.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell>{invitation.email}</TableCell>
            <TableCell>
              <Badge variant="secondary">{invitation.role}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {format(invitation.expiresAt, "MMM d, yyyy")}
            </TableCell>
            <TableCell>
              <ConfirmIconButton
                icon={XCircle}
                label="Revoke invitation"
                confirmMessage={`Revoke the invitation for ${invitation.email}?`}
                onConfirm={() => execute({ invitationId: invitation.id })}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
