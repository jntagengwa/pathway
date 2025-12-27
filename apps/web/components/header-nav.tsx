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
    <div className="flex items-center gap-6">
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
      <Link
        href="/pricing"
        className="text-sm text-pw-text-muted transition hover:text-pw-text"
      >
        Pricing
      </Link>
      <Link
        href="/resources"
        className="text-sm text-pw-text-muted transition hover:text-pw-text"
      >
        Resources
      </Link>
      <Link
        href="/demo"
        onClick={handleDemoClick}
        className="rounded-md bg-pw-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
      >
        Book a demo
      </Link>
      <Link
        href="https://app.nexsteps.dev"
        onClick={handleLoginClick}
        className="text-sm text-pw-text-muted transition hover:text-pw-text"
      >
        Login
      </Link>
    </div>
  );
}

