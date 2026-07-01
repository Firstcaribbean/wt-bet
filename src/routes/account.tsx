import { Link, createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, LockKeyhole, User } from "lucide-react";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

function AccountPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Account</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Sign in or create your profile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            This replaces the fake sign-in link with a real destination so the app no longer feels
            static.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button className="rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
              Continue with email
            </button>
            <button className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold">
              Create account
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <BadgeCheck className="h-5 w-5 text-primary" />
            <h2 className="mt-3 font-display text-lg font-bold">KYC ready</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ID upload and address proof can be added here.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <LockKeyhole className="h-5 w-5 text-accent" />
            <h2 className="mt-3 font-display text-lg font-bold">Secure withdrawals</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Withdrawal access unlocks after verification.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-primary hover:underline"
          >
            <User className="h-4 w-4" />
            Back to home
          </Link>
        </aside>
      </div>
    </main>
  );
}
