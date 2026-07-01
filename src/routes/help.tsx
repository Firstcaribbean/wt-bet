import { Link, createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, HelpCircle, Shield, Wallet } from "lucide-react";

const helpItems = [
  { title: "Account verification", icon: BadgeCheck, text: "Upload ID and proof of address." },
  { title: "Responsible play", icon: Shield, text: "Set limits or request self-exclusion." },
  { title: "Withdrawals", icon: Wallet, text: "Winnings withdrawals include a 10% fee." },
];

export const Route = createFileRoute("/help")({
  component: HelpPage,
});

function HelpPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Help center</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Support and policy</h1>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Back home
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {helpItems.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <item.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-4 font-display text-lg font-bold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-accent" />
            <h2 className="font-display text-lg font-bold">Need something specific?</h2>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            This page makes the Help and footer links work, and it is a good landing spot for
            support, terms, and privacy content later.
          </p>
        </section>
      </div>
    </main>
  );
}
