"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { Trash2 } from "lucide-react";

import { deleteClass } from "@/actions/classes";
import { ConfirmIconButton } from "@/components/confirm-icon-button";

export function DeleteClassButton({ classId, name }: { classId: string; name: string }) {
  const router = useRouter();

  const { execute } = useAction(deleteClass, {
    onSuccess: () => {
      toast.success("Class deleted.");
      router.push("/classes");
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to delete class."),
  });

  return (
    <ConfirmIconButton
      icon={Trash2}
      label="Delete class"
      confirmMessage={`Delete "${name}"? This removes the roster.`}
      onConfirm={() => execute({ classId })}
    />
  );
}
