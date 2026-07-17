"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { MaterialType } from "@prisma/client";
import { FileText, Video, Link2, FileType, Trash2, ChevronUp, ChevronDown } from "lucide-react";

import { deleteMaterial, moveMaterial } from "@/actions/materials";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ICONS: Record<MaterialType, typeof FileText> = {
  VIDEO: Video,
  DOCUMENT: FileText,
  LINK: Link2,
  TEXT: FileType,
};

export type MaterialWithUrl = {
  id: string;
  title: string;
  type: MaterialType;
  url: string | null;
  content: string | null;
  fileUrl: string | null;
};

export function MaterialItem({ material }: { material: MaterialWithUrl }) {
  const [showContent, setShowContent] = useState(false);
  const Icon = ICONS[material.type];

  const { execute: remove } = useAction(deleteMaterial, {
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to delete material."),
  });
  const { execute: move } = useAction(moveMaterial, {
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to reorder."),
  });

  const href = material.type === MaterialType.LINK ? material.url : material.fileUrl;

  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      {material.type === MaterialType.TEXT ? (
        <button
          type="button"
          className="flex-1 truncate text-left hover:underline"
          onClick={() => setShowContent(true)}
        >
          {material.title}
        </button>
      ) : (
        <a
          href={href ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 truncate hover:underline"
        >
          {material.title}
        </a>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Move up"
        onClick={() => move({ materialId: material.id, direction: "up" })}
      >
        <ChevronUp className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Move down"
        onClick={() => move({ materialId: material.id, direction: "down" })}
      >
        <ChevronDown className="size-4" />
      </Button>
      <ConfirmIconButton
        icon={Trash2}
        label="Delete material"
        confirmMessage={`Delete "${material.title}"?`}
        onConfirm={() => remove({ materialId: material.id })}
      />

      <Dialog open={showContent} onOpenChange={setShowContent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{material.title}</DialogTitle>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm">{material.content}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
