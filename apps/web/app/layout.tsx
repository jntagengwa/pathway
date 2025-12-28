import type { Metadata } from "next";
import "./globals.css";

const baseUrl = "https://nexsteps.dev";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Nexsteps – School Management Platform",
    template: "%s | Nexsteps",
  },
  description: "Nexsteps helps schools, clubs, churches, and charities manage attendance, rotas, safeguarding, and parent communication.",
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-shell text-text-primary">{children}</body>
    </html>
  );
}

