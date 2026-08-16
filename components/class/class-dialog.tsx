"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";

import { createClass, updateClass } from "@/actions/classes";
import { toDateInputValue } from "@/lib/utils";
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

const NO_INSTRUCTOR = "none";

const schema = z.object({
  courseId: z.string().optional(),
  name: z.string().min(1, "Name is required").max(200),
  instructorId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function ClassDialog({
  trigger,
  courses,
  instructors,
  klass,
}: {
  trigger: React.ReactNode;
  courses?: { id: string; title: string }[];
  instructors: { id: string; name: string }[];
  klass?: {
    id: string;
    name: string;
    instructorId: string | null;
    startDate: Date | null;
    endDate: Date | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!klass;

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
      courseId: courses?.[0]?.id,
      name: klass?.name ?? "",
      instructorId: klass?.instructorId ?? NO_INSTRUCTOR,
      startDate: toDateInputValue(klass?.startDate),
      endDate: toDateInputValue(klass?.endDate),
    },
  });

  const { execute: runCreate, isExecuting: isCreating } = useAction(createClass, {
    onSuccess: () => {
      toast.success("Class created.");
      setOpen(false);
      reset();
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to create class."),
  });

  const { execute: runUpdate, isExecuting: isUpdating } = useAction(updateClass, {
    onSuccess: () => {
      toast.success("Class updated.");
      setOpen(false);
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to update class."),
  });

  const onSubmit = (values: FormValues) => {
    const instructorId = values.instructorId === NO_INSTRUCTOR ? undefined : values.instructorId;

    if (isEdit) {
      runUpdate({ classId: klass.id, ...values, instructorId });
    } else {
      if (!values.courseId) return;
      runCreate({ ...values, courseId: values.courseId, instructorId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit class" : "New class"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isEdit && courses && (
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select
                value={watch("courseId")}
                onValueChange={(v) => setValue("courseId", v ?? undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="class-name">Name</Label>
            <Input id="class-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Instructor</Label>
            <Select
              value={watch("instructorId") || NO_INSTRUCTOR}
              onValueChange={(v) => setValue("instructorId", v ?? NO_INSTRUCTOR)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_INSTRUCTOR}>Unassigned</SelectItem>
                {instructors.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="class-start">Start date</Label>
              <Input id="class-start" type="date" {...register("startDate")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="class-end">End date</Label>
              <Input id="class-end" type="date" {...register("endDate")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isEdit ? "Save changes" : "Create class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
