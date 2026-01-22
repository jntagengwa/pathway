"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import AnalyticsProvider from "../../components/analytics-provider";
import Footer from "../../components/footer";
import HeaderNav from "../../components/header-nav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <AnalyticsProvider />
      {/* Floating/Sticky Header */}
      <div className="sticky top-4 z-50 px-4">
        <motion.header
          className={`mx-auto flex max-w-7xl items-center justify-between rounded-xl border transition-all duration-300 ${
            isScrolled
              ? "border-border-subtle bg-surface/95 backdrop-blur-sm shadow-lg"
              : "border-border-subtle bg-surface shadow-md"
          } px-4 py-3 md:px-6 md:py-4`}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href="/"
            className="flex items-center gap-2 transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:ring-offset-2 focus-visible:ring-status-info"
          >
            <Image
              src="/NSLogo.svg"
              alt="Nexsteps"
              width={32}
              height={32}
              className="w-8 h-8"
              priority
            />
            <span className="text-xl font-bold text-text-primary">NexSteps</span>
          </Link>
          <div className="relative">
            <HeaderNav />
          </div>
        </motion.header>
      </div>
      <main className="flex-1 bg-shell">{children}</main>
      <Footer />
    </div>
  );
}