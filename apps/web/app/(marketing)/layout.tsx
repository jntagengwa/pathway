import Link from "next/link";
import Image from "next/image";
import AnalyticsProvider from "../../components/analytics-provider";
import HeaderNav from "../../components/header-nav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnalyticsProvider />
      <header className="border-b border-border-subtle bg-surface">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:ring-offset-2 focus-visible:ring-status-info"
          >
            <Image
              src="/NSRecLogo.svg"
              alt="Nexsteps"
              width={240}
              height={128}
              className="w-auto object-contain"
              style={{ height: "5rem" }}
              priority
            />
          </Link>
          <HeaderNav />
        </nav>
      </header>
      <main className="flex-1 bg-shell">{children}</main>
      <footer className="mt-auto border-t border-border-subtle bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-sm font-semibold text-text-primary">
                Nexsteps
              </h3>
              <p className="text-sm text-text-muted">
                School management platform for attendance, rotas, safeguarding,
                and communication.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-text-primary">
                Product
              </h3>
              <ul className="flex flex-col gap-2 text-sm text-text-muted">
                <li>
                  <Link href="/" className="transition hover:text-pw-text">
                    Overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="transition hover:text-pw-text"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-text-primary">
                Sectors
              </h3>
              <ul className="flex flex-col gap-2 text-sm text-text-muted">
                <li>
                  <Link
                    href="/schools"
                    className="transition hover:text-pw-text"
                  >
                    For Schools
                  </Link>
                </li>
                <li>
                  <Link href="/clubs" className="transition hover:text-pw-text">
                    For Clubs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/churches"
                    className="transition hover:text-pw-text"
                  >
                    For Churches
                  </Link>
                </li>
                <li>
                  <Link
                    href="/charities"
                    className="transition hover:text-pw-text"
                  >
                    For Charities
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-text-primary">
                Resources
              </h3>
              <ul className="flex flex-col gap-2 text-sm text-text-muted">
                <li>
                  <Link
                    href="/resources"
                    className="transition hover:text-pw-text"
                  >
                    Resources
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="transition hover:text-pw-text"
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="transition hover:text-pw-text">
                    Book a demo
                  </Link>
                </li>
                <li>
                  <Link href="/trial" className="transition hover:text-pw-text">
                    Join trial waitlist
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-text-primary">
                Legal
              </h3>
              <ul className="flex flex-col gap-2 text-sm text-text-muted">
                <li>
                  <Link
                    href="/privacy"
                    className="transition hover:text-pw-text"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="transition hover:text-pw-text">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookies"
                    className="transition hover:text-pw-text"
                  >
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border-subtle pt-8 text-center text-sm text-text-muted">
            <p>
              &copy; {new Date().getFullYear()} Nexsteps. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
