"use client";

import { useState } from "react";
import { MaterialType } from "@prisma/client";
import { FileText, Video, Link2, FileType } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MaterialWithUrl } from "@/components/course/material-item";

const ICONS: Record<MaterialType, typeof FileText> = {
  VIDEO: Video,
  DOCUMENT: FileText,
  LINK: Link2,
  TEXT: FileType,
};

function MaterialLink({ material }: { material: MaterialWithUrl }) {
  const [showContent, setShowContent] = useState(false);
  const Icon = ICONS[material.type];
  const href = material.type === MaterialType.LINK ? material.url : material.fileUrl;

  if (material.type === MaterialType.TEXT) {
    return (
      <>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
          onClick={() => setShowContent(true)}
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          {material.title}
        </button>
        <Dialog open={showContent} onOpenChange={setShowContent}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{material.title}</DialogTitle>
            </DialogHeader>
            <p className="whitespace-pre-wrap text-sm">{material.content}</p>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <a
      href={href ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      {material.title}
    </a>
  );
}

export type CurriculumModule = {
  id: string;
  title: string;
  sessions: {
    id: string;
    title: string;
    description: string | null;
    materials: MaterialWithUrl[];
  }[];
};

export function CurriculumView({ modules }: { modules: CurriculumModule[] }) {
  if (modules.length === 0) {
    return <p className="text-sm text-muted-foreground">This course has no content yet.</p>;
  }

  return (
    <div className="space-y-4">
      {modules.map((courseModule) => (
        <Card key={courseModule.id}>
          <CardHeader>
            <CardTitle className="text-base">{courseModule.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {courseModule.sessions.map((session) => (
              <div key={session.id} className="rounded-md bg-muted/30 p-3">
                <p className="text-sm font-medium">{session.title}</p>
                {session.description && (
                  <p className="text-xs text-muted-foreground">{session.description}</p>
                )}
                <div className="mt-1.5 space-y-1">
                  {session.materials.map((material) => (
                    <MaterialLink key={material.id} material={material} />
                  ))}
                  {session.materials.length === 0 && (
                    <p className="px-2 text-xs text-muted-foreground">No materials yet.</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
