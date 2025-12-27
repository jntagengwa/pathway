"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  UserRound,
  GraduationCap,
  BookOpen,
  CalendarClock,
  CheckSquare,
  Megaphone,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/cn";

export type SidebarNavItem = {
  label: string;
  href: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  /** Optional access requirement - if not met, item will be filtered out */
  access?: string;
};

export type SidebarNavProps = {
  items?: SidebarNavItem[];
  currentPath?: string;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

// Icon components array - don't render here, render in component to avoid hydration issues
const iconComponents: LucideIcon[] = [
  LayoutDashboard,
  Users,
  GraduationCap,
  UserRound,
  BookOpen,
  CalendarClock,
  CheckSquare,
  Megaphone,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Settings,
];

// Base items without icons - icons will be added in the component to avoid SSR hydration issues
export const defaultSidebarItems: SidebarNavItem[] = [
  { label: "Dashboard", href: "/", icon: undefined },
  { label: "People", href: "/people", icon: undefined },
  { label: "Children", href: "/children", icon: undefined },
  { label: "Parents & Guardians", href: "/parents", icon: undefined },
  { label: "Lessons", href: "/lessons", icon: undefined },
  { label: "Sessions & Rota", href: "/sessions", icon: undefined },
  { label: "Attendance", href: "/attendance", icon: undefined },
  { label: "Notices & Announcements", href: "/notices", icon: undefined },
  { label: "Safeguarding", href: "/safeguarding", icon: undefined },
  { label: "Billing", href: "/billing", icon: undefined },
  { label: "Reports", href: "/reports", icon: undefined },
  { label: "Settings", href: "/settings", icon: undefined },
];

const isActive = (currentPath: string, href: string) =>
  currentPath === href || currentPath.startsWith(`${href}/`);

export const SidebarNav: React.FC<SidebarNavProps> = ({
  items = defaultSidebarItems,
  currentPath = "/",
  className,
  header,
  footer,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  // Track if component has mounted (client-side only)
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Add icons to items on client side only to avoid hydration mismatches
  // Only render icons after component has mounted to prevent SSR/client mismatch
  const itemsWithIcons = React.useMemo(() => {
    return items.map((item, index) => {
      // If item already has an icon, use it; otherwise add from iconComponents
      if (item.icon !== undefined && item.icon !== null) {
        return item;
      }
      // Only render icons after mount to avoid hydration issues
      if (!isMounted) {
        return { ...item, icon: null };
      }
      const IconComponent = iconComponents[index];
      return {
        ...item,
        icon: IconComponent ? <IconComponent className="h-4 w-4" /> : null,
      };
    });
  }, [items, isMounted]);

  return (
    <nav
      aria-label="Admin navigation"
      className={cn(
        "flex h-screen flex-col border-r border-border-subtle bg-surface shadow-soft transition-[width] duration-200 ease-out",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Logo at the top, aligned with top bar */}
      {header ? (
        <div className={cn("flex h-16 shrink-0 items-center border-b border-accent-secondary/30 px-3", isCollapsed && "justify-center")}>
          {header}
        </div>
      ) : null}
      {/* Collapse button below logo */}
      {onToggleCollapse ? (
        <div className="px-2 py-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-info focus-visible:ring-offset-2",
              isCollapsed && "justify-center border border-border-subtle bg-surface",
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-text-primary" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 text-text-muted" />
                <span className="text-xs text-text-muted">Collapse</span>
              </>
            )}
          </button>
        </div>
      ) : null}
      <div className="flex-1 overflow-y-auto px-3 py-6">
        <ul className="flex flex-col gap-1">
          {itemsWithIcons.map((item) => {
            const active = isActive(currentPath, item.href);
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-primary transition-all duration-150 ease-out hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-info focus-visible:ring-offset-2 motion-safe:hover:translate-x-0.5",
                    isCollapsed && "justify-center",
                    active
                      ? "bg-accent-subtle text-accent-strong"
                      : "hover:text-text-primary",
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </span>
                  {!isCollapsed && (item.badge ?? null)}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      {footer ? (
        <div className="border-t border-border-subtle pt-3 px-2">
          {footer}
        </div>
      ) : null}
    </nav>
  );
};
