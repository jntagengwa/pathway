import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexsteps – Plans & Pricing",
  description: "Choose your Nexsteps plan and complete checkout securely via Stripe.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-pw-surface text-pw-text">{children}</body>
    </html>
  );
}

