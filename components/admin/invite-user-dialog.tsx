"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { Role } from "@prisma/client";
import { Plus, Trash2 } from "lucide-react";

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
  name: z.string().min(1, "Name is required").max(200),
  role: z.nativeEnum(Role),
  classGrants: z.array(
    z.object({
      classId: z.string().min(1, "Select a class"),
      accessExpiresAt: z.string().optional(),
    })
  ),
});
type FormValues = z.infer<typeof schema>;

export function InviteUserDialog({
  trigger,
  classes,
}: {
  trigger: React.ReactNode;
  classes: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", name: "", role: Role.STUDENT, classGrants: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "classGrants" });
  const role = watch("role");
  const classGrants = watch("classGrants");

  const { execute, isExecuting } = useAction(createInvitation, {
    onSuccess: () => {
      toast.success("Invitation sent.");
      setOpen(false);
      reset();
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to send invitation."),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a user</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => execute(values))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-name">Name</Label>
            <Input id="invite-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                if (!v) return;
                setValue("role", v as Role);
                if (v !== Role.STUDENT) setValue("classGrants", []);
              }}
            >
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

          {role === Role.STUDENT && (
            <div className="space-y-2">
              <Label>Class access</Label>
              {fields.map((field, index) => {
                const chosenElsewhere = classGrants
                  .filter((_, i) => i !== index)
                  .map((g) => g.classId);
                const availableClasses = classes.filter(
                  (c) => !chosenElsewhere.includes(c.id) || c.id === classGrants[index]?.classId
                );
                return (
                  <div key={field.id} className="flex items-start gap-2">
                    <Select
                      value={watch(`classGrants.${index}.classId`)}
                      onValueChange={(v) => v && setValue(`classGrants.${index}.classId`, v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClasses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      className="w-40"
                      title="Expiration date (optional)"
                      {...register(`classGrants.${index}.accessExpiresAt`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove class"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={fields.length >= classes.length}
                onClick={() => append({ classId: "", accessExpiresAt: "" })}
              >
                <Plus className="size-3.5" /> Add class
              </Button>
              <p className="text-xs text-muted-foreground">
                Leave the date blank for open-ended access.
              </p>
            </div>
          )}

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
