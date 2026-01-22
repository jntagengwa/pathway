"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { track } from "../lib/analytics";

export default function HeaderNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const navLinks = [
    { label: "Product", href: "/" },
    { label: "Pricing", href: "/pricing" },
    { label: "Resources", href: "/resources" },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden items-center gap-6 md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-text-primary transition hover:text-accent-primary"
          >
            {link.label}
          </Link>
        ))}

        {/* Action Buttons */}
        <div className="ml-4 flex items-center gap-3">
          <Link
            href="https://app.nexsteps.dev"
            onClick={handleLoginClick}
            className="rounded-md border border-border-subtle bg-surface px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-muted"
          >
            Sign in
          </Link>
          <Link
            href="/demo"
            onClick={handleDemoClick}
            className="rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-accent-strong"
          >
            Request a Demo
          </Link>
        </div>
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="flex flex-col gap-1.5 md:hidden"
        aria-label="Toggle menu"
      >
        <motion.span
          className="h-0.5 w-6 bg-text-primary"
          animate={{
            rotate: isMobileMenuOpen ? 45 : 0,
            y: isMobileMenuOpen ? 6 : 0,
          }}
          transition={{ duration: 0.2 }}
        />
        <motion.span
          className="h-0.5 w-6 bg-text-primary"
          animate={{ opacity: isMobileMenuOpen ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        />
        <motion.span
          className="h-0.5 w-6 bg-text-primary"
          animate={{
            rotate: isMobileMenuOpen ? -45 : 0,
            y: isMobileMenuOpen ? -6 : 0,
          }}
          transition={{ duration: 0.2 }}
        />
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border-subtle bg-surface p-4 shadow-lg md:hidden"
            >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-medium text-text-primary transition hover:text-accent-primary"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
                <Link
                  href="https://app.nexsteps.dev"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLoginClick();
                  }}
                  className="rounded-md border border-border-subtle bg-surface px-4 py-2 text-center text-sm font-medium text-text-primary transition hover:bg-muted"
                >
                  Sign in
                </Link>
                <Link
                  href="/demo"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleDemoClick();
                  }}
                  className="rounded-md bg-accent-primary px-4 py-2 text-center text-sm font-medium text-white shadow-sm transition hover:bg-accent-strong"
                >
                  Request a Demo
                </Link>
              </div>
            </nav>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}