import Link from "next/link";
import { Menu } from "lucide-react";
import type { Role } from "@prisma/client";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Sidebar } from "./sidebar";

export function Navbar({ role, name }: { role: Role; name: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
              </Button>
            }
          />
          <SheetContent side="left" className="p-0">
            <SheetTitle className="px-4 pt-4">Erasight LMS</SheetTitle>
            <Sidebar role={role} />
          </SheetContent>
        </Sheet>
        <Link href="/" className="font-semibold">
          Erasight LMS
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{name}</span>
        <Badge variant="secondary">{role}</Badge>
        <SignOutButton />
      </div>
    </header>
  );
}
