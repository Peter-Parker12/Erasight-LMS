"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { CourseStatus } from "@prisma/client";

import { createCourse, updateCourse } from "@/actions/courses";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(CourseStatus),
});

type FormValues = z.infer<typeof schema>;

export function CourseDialog({
  trigger,
  course,
}: {
  trigger: React.ReactNode;
  course?: { id: string; title: string; description: string | null; status: CourseStatus };
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!course;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: course?.title ?? "",
      description: course?.description ?? "",
      status: course?.status ?? CourseStatus.DRAFT,
    },
  });

  const { execute: runCreate, isExecuting: isCreating } = useAction(createCourse, {
    onSuccess: () => {
      toast.success("Course created.");
      setOpen(false);
      reset();
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to create course."),
  });

  const { execute: runUpdate, isExecuting: isUpdating } = useAction(updateCourse, {
    onSuccess: () => {
      toast.success("Course updated.");
      setOpen(false);
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to update course."),
  });

  const onSubmit = (values: FormValues) => {
    if (isEdit) {
      runUpdate({ courseId: course.id, ...values });
    } else {
      runCreate(values);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit course" : "New course"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the course details." : "Create a new course curriculum."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>

          {isEdit && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v as CourseStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CourseStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={CourseStatus.PUBLISHED}>Published</SelectItem>
                  <SelectItem value={CourseStatus.ARCHIVED}>Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isEdit ? "Save changes" : "Create course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
