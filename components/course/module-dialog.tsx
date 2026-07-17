"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";

import { createModule, updateModule } from "@/actions/modules";
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

const schema = z.object({ title: z.string().min(1, "Title is required").max(200) });
type FormValues = z.infer<typeof schema>;

export function ModuleDialog({
  trigger,
  courseId,
  module: existingModule,
}: {
  trigger: React.ReactNode;
  courseId?: string;
  module?: { id: string; title: string };
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!existingModule;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: existingModule?.title ?? "" },
  });

  const { execute: runCreate, isExecuting: isCreating } = useAction(createModule, {
    onSuccess: () => {
      toast.success("Module added.");
      setOpen(false);
      reset();
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to add module."),
  });

  const { execute: runUpdate, isExecuting: isUpdating } = useAction(updateModule, {
    onSuccess: () => {
      toast.success("Module updated.");
      setOpen(false);
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to update module."),
  });

  const onSubmit = (values: FormValues) => {
    if (isEdit) {
      runUpdate({ moduleId: existingModule.id, ...values });
    } else {
      if (!courseId) return;
      runCreate({ courseId, ...values });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit module" : "Add module"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="module-title">Title</Label>
            <Input id="module-title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isEdit ? "Save changes" : "Add module"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
