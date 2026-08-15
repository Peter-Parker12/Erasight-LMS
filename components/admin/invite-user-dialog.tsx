"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { Role } from "@prisma/client";

import { createInvitation } from "@/actions/invitations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.nativeEnum(Role),
});
type FormValues = z.infer<typeof schema>;

export function InviteUserDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", role: Role.STUDENT },
  });

  const { execute, isExecuting } = useAction(createInvitation, {
    onSuccess: () => {
      toast.success("Invitation sent.");
      setOpen(false);
      reset();
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to send invitation."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a user</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => execute(values))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={watch("role")} onValueChange={(v) => v && setValue("role", v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.STUDENT}>Student</SelectItem>
                <SelectItem value={Role.INSTRUCTOR}>Instructor</SelectItem>
                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isExecuting}>
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
