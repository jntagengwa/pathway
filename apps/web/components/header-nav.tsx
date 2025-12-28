"use client";

import Link from "next/link";
import { track } from "../lib/analytics";

export default function HeaderNav() {
  const handleLoginClick = () => {
    const path = window.location.pathname;
    const sector = path.startsWith("/schools")
      ? "schools"
      : path.startsWith("/clubs")
        ? "clubs"
        : path.startsWith("/churches")
          ? "churches"
          : path.startsWith("/charities")
            ? "charities"
            : null;
    track({
      type: "app_login_click",
      location: "header_nav",
      sector,
    });
  };

  const handleDemoClick = () => {
    const path = window.location.pathname;
    const sector = path.startsWith("/schools")
      ? "schools"
      : path.startsWith("/clubs")
        ? "clubs"
        : path.startsWith("/churches")
          ? "churches"
          : path.startsWith("/charities")
            ? "charities"
            : null;
    track({
      type: "cta_demo_click",
      location: "header_nav",
      sector,
    });
  };

  return (
    <nav className="flex items-center gap-4 flex-wrap">
      {/* Product */}
      <Link
        href="/"
        className="text-sm text-pw-text-muted transition hover:text-pw-text"
      >
        Product
      </Link>

      {/* Sectors - individual links for better mobile support */}
      <Link
        href="/schools"
        className="text-sm text-pw-text-muted transition hover:text-pw-text"
      >
        Schools
      </Link>
      <Link
        href="/clubs"
        className="text-sm text-pw-text-muted transition hover:text-pw-text"
      >
        Clubs
      </Link>
      <Link
        href="/churches"
        className="text-sm text-pw-text-muted transition hover:text-pw-text"
      >
        Churches
      </Link>
      <Link
        href="/charities"
        className="text-sm text-pw-text-muted transition hover:text-pw-text"
      >
        Charities
      </Link>

      {/* Pricing */}
      <Link
        href="/pricing"
        className="text-sm text-pw-text-muted transition hover:text-pw-text"
      >
        Pricing
      </Link>

      {/* Resources */}
      <Link
        href="/resources"
        className="text-sm text-pw-text-muted transition hover:text-pw-text"
      >
        Resources
      </Link>

      {/* Security */}
      <Link
        href="/security"
        className="text-sm text-pw-text-muted transition hover:text-pw-text"
      >
        Security
      </Link>

      {/* Book demo CTA */}
      <Link
        href="/demo"
        onClick={handleDemoClick}
        className="rounded-md bg-pw-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
      >
        Book demo
      </Link>

      {/* Login */}
      <Link
        href="https://app.nexsteps.dev"
        onClick={handleLoginClick}
        className="text-sm text-pw-text-muted transition hover:text-pw-text"
      >
        Login
      </Link>
    </nav>
  );
}
