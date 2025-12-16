import React from "react";
import type { Metadata } from "next";
import { AdminShell } from "./admin-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "PathWay Admin",
  description: "PathWay admin console for schools and youth organisations.",
  icons: {
    icon: "/pathwayLogo.png",
    shortcut: "/pathwayLogo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-shell">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
