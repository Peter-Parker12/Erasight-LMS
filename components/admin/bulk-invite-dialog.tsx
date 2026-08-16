"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SkippedEntry = { row: number | null; email: string | null; reason: string };
type ImportResult = {
  totalRows: number;
  createdCount: number;
  created: { email: string; name: string; classCount: number }[];
  skipped: SkippedEntry[];
};

export function BulkInviteDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/invitations/bulk-import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Import failed.");
        return;
      }
      setResult(data);
      if (data.createdCount > 0) {
        toast.success(`${data.createdCount} invitation(s) sent.`);
        router.refresh();
      }
    } catch {
      toast.error("Import failed.");
    } finally {
      setIsImporting(false);
    }
  };

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
          <DialogTitle>Bulk invite students</DialogTitle>
          <DialogDescription>
            Upload a filled-in template to invite many students at once. Each invite grants the
            class(es) listed for that student&apos;s email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <a
            href="/api/admin/invitations/template"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Download className="size-3.5" /> Download template
          </a>

          <div className="space-y-1.5">
            <Label htmlFor="bulk-file">Spreadsheet (.xlsx)</Label>
            <Input
              id="bulk-file"
              type="file"
              accept=".xlsx"
              disabled={isImporting}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {result && (
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <p>
                {result.createdCount} of {result.totalRows} row(s) resulted in an invitation sent.
              </p>
              {result.skipped.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-destructive">Issues:</p>
                  <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                    {result.skipped.map((s, i) => (
                      <li key={i}>
                        {s.row ? `Row ${s.row}` : s.email ?? "Unknown"}: {s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" disabled={!file || isImporting} onClick={handleImport}>
            {isImporting && <Loader2 className="size-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
