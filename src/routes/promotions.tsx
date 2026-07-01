import { Link, createFileRoute } from "@tanstack/react-router";
import { Gift, Sparkles, TicketPercent } from "lucide-react";

const promos = [
  { title: "Welcome bonus", value: "100% up to $250" },
  { title: "Odds boost", value: "Selected matches daily" },
  { title: "Free bet", value: "For new account verification" },
];

export const Route = createFileRoute("/promotions")({
  component: PromotionsPage,
});

function PromotionsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Promotions</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Offers and incentives</h1>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Back home
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {promos.map((promo) => (
            <article
              key={promo.title}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <Gift className="h-5 w-5 text-accent" />
              <h2 className="mt-4 font-display text-lg font-bold">{promo.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{promo.value}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-gradient-hero p-6 text-primary-foreground shadow-elegant">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">Bonus details</p>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
            This page gives the promotions link a real destination so users can click through
            instead of hitting a dead placeholder.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary">
            <TicketPercent className="h-4 w-4" />
            Claim from your account page
          </div>
        </section>
      </div>
    </main>
  );
}
