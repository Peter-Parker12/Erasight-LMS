"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { MaterialType } from "@prisma/client";
import { Loader2 } from "lucide-react";

import { createMaterial } from "@/actions/materials";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UploadedFile = { fileKey: string; fileType: string; fileSize: number };

async function uploadFile(file: File): Promise<UploadedFile> {
  const fileType = file.type || "application/octet-stream";
  const params = new URLSearchParams({ fileName: file.name, fileType });

  const res = await fetch(`/api/uploads?${params}`, {
    method: "PUT",
    headers: { "Content-Type": fileType },
    body: file,
  });
  if (!res.ok) throw new Error("Upload failed.");
  const { fileKey } = await res.json();

  return { fileKey, fileType, fileSize: file.size };
}

export function MaterialDialog({
  trigger,
  sessionId,
}: {
  trigger: React.ReactNode;
  sessionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<MaterialType>(MaterialType.LINK);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const reset = () => {
    setType(MaterialType.LINK);
    setTitle("");
    setUrl("");
    setContent("");
    setUploadedFile(null);
  };

  const { execute: runCreate, isExecuting: isCreating } = useAction(createMaterial, {
    onSuccess: () => {
      toast.success("Material added.");
      setOpen(false);
      reset();
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to add material."),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadFile(file);
      setUploadedFile(uploaded);
      if (!title) setTitle(file.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }

    if (type === MaterialType.LINK) {
      runCreate({ sessionId, type: MaterialType.LINK, title, url });
    } else if (type === MaterialType.TEXT) {
      runCreate({ sessionId, type: MaterialType.TEXT, title, content });
    } else {
      if (!uploadedFile) {
        toast.error("Upload a file first.");
        return;
      }
      runCreate({ sessionId, type, title, ...uploadedFile });
    }
  };

  const canSubmit =
    !isCreating &&
    !isUploading &&
    title.trim().length > 0 &&
    ((type === MaterialType.LINK && url.trim().length > 0) ||
      (type === MaterialType.TEXT && content.trim().length > 0) ||
      ((type === MaterialType.VIDEO || type === MaterialType.DOCUMENT) && !!uploadedFile));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add material</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as MaterialType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MaterialType.LINK}>Link</SelectItem>
                <SelectItem value={MaterialType.TEXT}>Text</SelectItem>
                <SelectItem value={MaterialType.VIDEO}>Video</SelectItem>
                <SelectItem value={MaterialType.DOCUMENT}>Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="material-title">Title</Label>
            <Input id="material-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {type === MaterialType.LINK && (
            <div className="space-y-1.5">
              <Label htmlFor="material-url">URL</Label>
              <Input
                id="material-url"
                type="url"
                placeholder="https://…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          )}

          {type === MaterialType.TEXT && (
            <div className="space-y-1.5">
              <Label htmlFor="material-content">Content</Label>
              <Textarea
                id="material-content"
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          )}

          {(type === MaterialType.VIDEO || type === MaterialType.DOCUMENT) && (
            <div className="space-y-1.5">
              <Label htmlFor="material-file">
                {type === MaterialType.VIDEO ? "Video file" : "Document file"}
              </Label>
              <Input
                id="material-file"
                type="file"
                accept={type === MaterialType.VIDEO ? "video/*" : undefined}
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {isUploading && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Uploading…
                </p>
              )}
              {uploadedFile && !isUploading && (
                <p className="text-sm text-muted-foreground">Uploaded ✓</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              Add material
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
