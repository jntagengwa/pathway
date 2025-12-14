import * as React from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarClock,
  CheckSquare,
  Megaphone,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "../lib/cn";

export type SidebarNavItem = {
  label: string;
  href: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
};

export type SidebarNavProps = {
  items?: SidebarNavItem[];
  currentPath?: string;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
};

const defaultIcons = [
  <LayoutDashboard key="dashboard" className="h-4 w-4" />,
  <Users key="users" className="h-4 w-4" />,
  <GraduationCap key="children" className="h-4 w-4" />,
  <CalendarClock key="sessions" className="h-4 w-4" />,
  <CheckSquare key="attendance" className="h-4 w-4" />,
  <Megaphone key="notices" className="h-4 w-4" />,
  <ShieldCheck key="safeguarding" className="h-4 w-4" />,
  <CreditCard key="billing" className="h-4 w-4" />,
  <BarChart3 key="reports" className="h-4 w-4" />,
  <Settings key="settings" className="h-4 w-4" />,
];

export const defaultSidebarItems: SidebarNavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "People / Users", href: "/people" },
  { label: "Children", href: "/children" },
  { label: "Sessions & Attendance", href: "/sessions" },
  { label: "Attendance", href: "/attendance" },
  { label: "Notices / Lessons", href: "/notices" },
  { label: "Safeguarding", href: "/safeguarding" },
  { label: "Billing", href: "/billing" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
].map((item, index) => ({
  ...item,
  icon: defaultIcons[index],
}));

const isActive = (currentPath: string, href: string) =>
  currentPath === href || currentPath.startsWith(`${href}/`);

export const SidebarNav: React.FC<SidebarNavProps> = ({
  items = defaultSidebarItems,
  currentPath = "/",
  className,
  header,
  footer,
}) => {
  return (
    <nav
      aria-label="Admin navigation"
      className={cn(
        "flex h-full min-h-screen w-64 flex-col gap-3 border-r border-border-subtle bg-surface px-3 py-6 shadow-soft",
        className,
      )}
    >
      {header ? <div className="px-2">{header}</div> : null}
      <div className="flex-1">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = isActive(currentPath, item.href);
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    active
                      ? "bg-accent-subtle text-accent-strong"
                      : "hover:text-text-primary",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge ?? null}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      {footer ? (
        <div className="border-t border-border-subtle pt-3 text-xs text-text-muted px-2">
          {footer}
        </div>
      ) : null}
    </nav>
  );
};
