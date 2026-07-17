"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmIconButton({
  icon: Icon,
  confirmMessage,
  onConfirm,
  disabled,
  label,
}: {
  icon: LucideIcon;
  confirmMessage: string;
  onConfirm: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (window.confirm(confirmMessage)) onConfirm();
      }}
    >
      <Icon className="size-4" />
    </Button>
  );
}
