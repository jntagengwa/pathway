"use client";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get("returnTo") ?? "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface">
      <div className="w-full max-w-md rounded-lg border border-border-subtle bg-white p-6 shadow-sm">
        <div className="mb-4 text-center">
          <p className="text-sm uppercase tracking-wide text-text-muted">Nexsteps Admin</p>
          <h1 className="text-2xl font-semibold text-text-primary">Sign in</h1>
          <p className="mt-1 text-sm text-text-muted">
            Use your organisation login to continue.
          </p>
        </div>
        <button
          type="button"
          onClick={() => signIn("auth0", { callbackUrl: returnTo })}
          className="mt-4 w-full rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary/90"
        >
          Continue with SSO
        </button>
      </div>
    </main>
  );
}
