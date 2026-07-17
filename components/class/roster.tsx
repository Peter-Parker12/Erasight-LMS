"use client";

import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { UserMinus } from "lucide-react";

import { removeEnrollment } from "@/actions/enrollment";
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

export type RosterEntry = {
  enrollmentId: string;
  name: string;
  email: string;
  status: string;
};

export function Roster({ entries, canManage }: { entries: RosterEntry[]; canManage: boolean }) {
  const { execute } = useAction(removeEnrollment, {
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to remove student."),
  });

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No students enrolled yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          {canManage && <TableHead className="w-10" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.enrollmentId}>
            <TableCell>{entry.name}</TableCell>
            <TableCell className="text-muted-foreground">{entry.email}</TableCell>
            <TableCell>
              <Badge variant="secondary">{entry.status}</Badge>
            </TableCell>
            {canManage && (
              <TableCell>
                <ConfirmIconButton
                  icon={UserMinus}
                  label="Remove student"
                  confirmMessage={`Remove ${entry.name} from this class?`}
                  onConfirm={() => execute({ enrollmentId: entry.enrollmentId })}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
