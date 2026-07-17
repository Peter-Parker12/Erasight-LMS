import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "./_components/nav/navbar";
import { Sidebar } from "./_components/nav/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    // Signed in with Clerk but the user.created webhook hasn't synced a local
    // row yet (or isn't configured). Nothing to show without a role.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-medium">Setting up your account…</p>
        <p className="text-sm text-muted-foreground">
          This should only take a moment. Refresh the page shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar role={user.role} name={user.name} />
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r md:block">
          <Sidebar role={user.role} />
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
