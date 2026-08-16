"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { Plus, Trash2 } from "lucide-react";

import { setStudentClassAccess } from "@/actions/enrollment";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  grants: z.array(
    z.object({
      classId: z.string().min(1, "Select a class"),
      accessExpiresAt: z.string().optional(),
    })
  ),
});
type FormValues = z.infer<typeof schema>;

export function ManageStudentClassesDialog({
  trigger,
  studentId,
  studentName,
  classes,
  currentGrants,
}: {
  trigger: React.ReactNode;
  studentId: string;
  studentName: string;
  classes: { id: string; label: string }[];
  currentGrants: { classId: string; accessExpiresAt: string }[];
}) {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, setValue, watch, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { grants: currentGrants },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "grants" });
  const grants = watch("grants");

  const { execute, isExecuting } = useAction(setStudentClassAccess, {
    onSuccess: () => {
      toast.success("Class access updated.");
      setOpen(false);
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to update class access."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage classes for {studentName}</DialogTitle>
          <DialogDescription>
            Add, remove, or change the expiration date for this student&apos;s class access.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => execute({ studentId, grants: values.grants }))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Class access</Label>
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No class access yet.</p>
            )}
            {fields.map((field, index) => {
              const chosenElsewhere = grants.filter((_, i) => i !== index).map((g) => g.classId);
              const availableClasses = classes.filter(
                (c) => !chosenElsewhere.includes(c.id) || c.id === grants[index]?.classId
              );
              return (
                <div key={field.id} className="flex items-start gap-2">
                  <Select
                    value={watch(`grants.${index}.classId`)}
                    onValueChange={(v) => v && setValue(`grants.${index}.classId`, v)}
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
                    {...register(`grants.${index}.accessExpiresAt`)}
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
              Leave the date blank for open-ended access. Removing a row removes that class&apos;s
              access entirely.
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isExecuting}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
