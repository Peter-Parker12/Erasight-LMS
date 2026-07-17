"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { Trash2 } from "lucide-react";

import { deleteCourse } from "@/actions/courses";
import { ConfirmIconButton } from "@/components/confirm-icon-button";

export function DeleteCourseButton({ courseId, title }: { courseId: string; title: string }) {
  const router = useRouter();

  const { execute } = useAction(deleteCourse, {
    onSuccess: () => {
      toast.success("Course deleted.");
      router.push("/courses");
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to delete course."),
  });

  return (
    <ConfirmIconButton
      icon={Trash2}
      label="Delete course"
      confirmMessage={`Delete "${title}"? This removes all modules, sessions and materials.`}
      onConfirm={() => execute({ courseId })}
    />
  );
}
