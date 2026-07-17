"use client";

import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { Pencil, Trash2, ChevronUp, ChevronDown, Plus } from "lucide-react";

import { deleteModule, moveModule } from "@/actions/modules";
import { ModuleDialog } from "@/components/course/module-dialog";
import { SessionDialog } from "@/components/course/session-dialog";
import { SessionSection, type SessionWithMaterials } from "@/components/course/session-section";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ModuleWithSessions = {
  id: string;
  title: string;
  sessions: SessionWithMaterials[];
};

export function ModuleSection({ module: courseModule }: { module: ModuleWithSessions }) {
  const { execute: remove } = useAction(deleteModule, {
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to delete module."),
  });
  const { execute: move } = useAction(moveModule, {
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to reorder."),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{courseModule.title}</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Move up"
            onClick={() => move({ moduleId: courseModule.id, direction: "up" })}
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Move down"
            onClick={() => move({ moduleId: courseModule.id, direction: "down" })}
          >
            <ChevronDown className="size-4" />
          </Button>
          <ModuleDialog
            module={courseModule}
            trigger={
              <Button type="button" variant="ghost" size="icon" aria-label="Edit module">
                <Pencil className="size-4" />
              </Button>
            }
          />
          <ConfirmIconButton
            icon={Trash2}
            label="Delete module"
            confirmMessage={`Delete "${courseModule.title}" and all its sessions?`}
            onConfirm={() => remove({ moduleId: courseModule.id })}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {courseModule.sessions.map((session) => (
          <SessionSection key={session.id} session={session} />
        ))}
        <SessionDialog
          moduleId={courseModule.id}
          trigger={
            <Button type="button" variant="outline" size="sm">
              <Plus className="size-3.5" /> Add session
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}
