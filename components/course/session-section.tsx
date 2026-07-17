"use client";

import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { Pencil, Trash2, ChevronUp, ChevronDown, Plus } from "lucide-react";

import { deleteSession, moveSession } from "@/actions/sessions";
import { SessionDialog } from "@/components/course/session-dialog";
import { MaterialDialog } from "@/components/course/material-dialog";
import { MaterialItem, type MaterialWithUrl } from "@/components/course/material-item";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { Button } from "@/components/ui/button";

export type SessionWithMaterials = {
  id: string;
  title: string;
  description: string | null;
  materials: MaterialWithUrl[];
};

export function SessionSection({ session }: { session: SessionWithMaterials }) {
  const { execute: remove } = useAction(deleteSession, {
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to delete session."),
  });
  const { execute: move } = useAction(moveSession, {
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to reorder."),
  });

  return (
    <div className="space-y-2 rounded-md bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <p className="text-sm font-medium">{session.title}</p>
          {session.description && (
            <p className="text-xs text-muted-foreground">{session.description}</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Move up"
          onClick={() => move({ sessionId: session.id, direction: "up" })}
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Move down"
          onClick={() => move({ sessionId: session.id, direction: "down" })}
        >
          <ChevronDown className="size-4" />
        </Button>
        <SessionDialog
          session={session}
          trigger={
            <Button type="button" variant="ghost" size="icon" aria-label="Edit session">
              <Pencil className="size-4" />
            </Button>
          }
        />
        <ConfirmIconButton
          icon={Trash2}
          label="Delete session"
          confirmMessage={`Delete "${session.title}" and all its materials?`}
          onConfirm={() => remove({ sessionId: session.id })}
        />
      </div>

      <div className="space-y-1.5 pl-1">
        {session.materials.map((material) => (
          <MaterialItem key={material.id} material={material} />
        ))}
        <MaterialDialog
          sessionId={session.id}
          trigger={
            <Button type="button" variant="outline" size="sm" className="mt-1">
              <Plus className="size-3.5" /> Add material
            </Button>
          }
        />
      </div>
    </div>
  );
}
