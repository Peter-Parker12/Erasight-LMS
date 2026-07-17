import Link from "next/link";
import { FileText, Video, Link2, FileType } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MaterialType } from "@prisma/client";

const ICONS: Record<MaterialType, typeof FileText> = {
  VIDEO: Video,
  DOCUMENT: FileText,
  LINK: Link2,
  TEXT: FileType,
};

export type RecentMaterial = {
  id: string;
  title: string;
  type: MaterialType;
  createdAt: Date;
  courseId: string;
  courseTitle: string;
};

export function RecentMaterials({ materials }: { materials: RecentMaterial[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Recently added materials</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {materials.length === 0 && (
          <p className="text-sm text-muted-foreground">No materials yet.</p>
        )}
        {materials.map((material) => {
          const Icon = ICONS[material.type];
          return (
            <Link
              key={material.id}
              href={`/courses/${material.courseId}`}
              className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{material.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{material.courseTitle}</span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
