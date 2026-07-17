import { Role } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, BookOpen, Users, ShieldCheck } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: [Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT],
  },
  {
    label: "Courses",
    href: "/courses",
    icon: BookOpen,
    roles: [Role.ADMIN, Role.INSTRUCTOR],
  },
  {
    label: "Classes",
    href: "/classes",
    icon: Users,
    roles: [Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: ShieldCheck,
    roles: [Role.ADMIN],
  },
];

export function navItemsForRole(role: Role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
