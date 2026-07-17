"use client";

import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { Role } from "@prisma/client";

import { updateUserRole } from "@/actions/users";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UserRoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: Role;
  disabled?: boolean;
}) {
  const { execute, isExecuting } = useAction(updateUserRole, {
    onSuccess: () => toast.success("Role updated."),
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to update role."),
  });

  return (
    <Select
      value={role}
      disabled={disabled || isExecuting}
      onValueChange={(v) => v && execute({ userId, role: v as Role })}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={Role.ADMIN}>Admin</SelectItem>
        <SelectItem value={Role.INSTRUCTOR}>Instructor</SelectItem>
        <SelectItem value={Role.STUDENT}>Student</SelectItem>
      </SelectContent>
    </Select>
  );
}
