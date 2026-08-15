import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "./_components/nav/navbar";
import { Sidebar } from "./_components/nav/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    // proxy.ts already redirects unauthenticated requests to /sign-in before
    // they reach this layout — this is just a defensive fallback.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-medium">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar role={user.role} name={user.name ?? "User"} />
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r md:block">
          <Sidebar role={user.role} />
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
