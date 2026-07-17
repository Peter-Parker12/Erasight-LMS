"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";

import { enrollStudent } from "@/actions/enrollment";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EnrollStudentDialog({
  trigger,
  classId,
  availableStudents,
}: {
  trigger: React.ReactNode;
  classId: string;
  availableStudents: { id: string; name: string; email: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");

  const { execute, isExecuting } = useAction(enrollStudent, {
    onSuccess: () => {
      toast.success("Student enrolled.");
      setOpen(false);
      setStudentId("");
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to enroll student."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll student</DialogTitle>
        </DialogHeader>

        {availableStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All students are already enrolled in this class.
          </p>
        ) : (
          <Select value={studentId} onValueChange={(v) => setStudentId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              {availableStudents.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <DialogFooter>
          <Button
            type="button"
            disabled={!studentId || isExecuting}
            onClick={() => execute({ classId, studentId })}
          >
            Enroll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
