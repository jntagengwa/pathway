import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-pw-border bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-pw-text">
            Nexsteps
          </Link>
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
              className="rounded-md bg-pw-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
            >
              Book a demo
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-auto border-t border-pw-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-sm font-semibold text-pw-text">
                Nexsteps
              </h3>
              <p className="text-sm text-pw-text-muted">
                School management platform for attendance, rotas, safeguarding,
                and communication.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-pw-text">
                Product
              </h3>
              <ul className="flex flex-col gap-2 text-sm text-pw-text-muted">
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
              <h3 className="mb-4 text-sm font-semibold text-pw-text">
                Resources
              </h3>
              <ul className="flex flex-col gap-2 text-sm text-pw-text-muted">
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
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-pw-text">Legal</h3>
              <ul className="flex flex-col gap-2 text-sm text-pw-text-muted">
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
          <div className="mt-8 border-t border-pw-border pt-8 text-center text-sm text-pw-text-muted">
            <p>
              &copy; {new Date().getFullYear()} Nexsteps. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
