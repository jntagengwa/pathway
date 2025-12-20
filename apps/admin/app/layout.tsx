import React from "react";
import type { Metadata } from "next";
import { AdminShell } from "./admin-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexsteps Admin",
  description: "Nexsteps admin console for schools and youth organisations.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
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
