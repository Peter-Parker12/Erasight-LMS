"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";

import { createSession, updateSession } from "@/actions/sessions";
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
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
});
type FormValues = z.infer<typeof schema>;

export function SessionDialog({
  trigger,
  moduleId,
  session,
}: {
  trigger: React.ReactNode;
  moduleId?: string;
  session?: { id: string; title: string; description: string | null };
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!session;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: session?.title ?? "",
      description: session?.description ?? "",
    },
  });

  const { execute: runCreate, isExecuting: isCreating } = useAction(createSession, {
    onSuccess: () => {
      toast.success("Session added.");
      setOpen(false);
      reset();
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to add session."),
  });

  const { execute: runUpdate, isExecuting: isUpdating } = useAction(updateSession, {
    onSuccess: () => {
      toast.success("Session updated.");
      setOpen(false);
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to update session."),
  });

  const onSubmit = (values: FormValues) => {
    if (isEdit) {
      runUpdate({ sessionId: session.id, ...values });
    } else {
      if (!moduleId) return;
      runCreate({ moduleId, ...values });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit session" : "Add session"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="session-title">Title</Label>
            <Input id="session-title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="session-description">Description</Label>
            <Textarea id="session-description" rows={3} {...register("description")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isEdit ? "Save changes" : "Add session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
