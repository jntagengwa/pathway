"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarNav,
  TopBar,
  type SidebarNavItem,
  defaultSidebarItems,
} from "@pathway/ui";

const navItems: SidebarNavItem[] = defaultSidebarItems;

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/people": "People",
  "/users": "People",
  "/children": "Children",
  "/parents": "Parents & Guardians",
  "/lessons": "Lessons",
  "/sessions": "Sessions & Rota",
  "/attendance": "Attendance",
  "/notices": "Notices & Announcements",
  "/safeguarding": "Safeguarding",
  "/billing": "Billing",
  "/reports": "Reports",
  "/settings": "Settings",
};

const resolveTitle = (path: string): string => {
  if (titleMap[path]) return titleMap[path];
  const topSegment = `/${path.split("/").filter(Boolean)[0] ?? ""}`;
  return titleMap[topSegment] ?? "Admin";
};

export const AdminShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname() || "/";
  const title = resolveTitle(pathname);

  return (
    <div className="flex min-h-screen bg-shell text-text-primary">
      <SidebarNav
        items={navItems}
        currentPath={pathname}
        header={
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-md px-4 py-4 transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
          >
            <Image
              src="/pathwayLogo.png"
              alt="PathWay"
              width={48}
              height={48}
              className="rounded-md shadow-sm"
              priority
            />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-text-primary">
                PathWay
              </span>
              <span className="text-xs text-text-muted">Admin</span>
            </div>
          </Link>
        }
        footer={
          <p className="px-2 text-xs text-text-muted">
            {/* TODO: replace with responsive sidebar toggle/drawer on tablet/mobile */}
            Collapsible sidebar coming soon
          </p>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col bg-shell">
        <TopBar title={title} />
        <main className="flex-1 px-8 py-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
