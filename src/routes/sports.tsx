import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, ChevronRight, Target, Trophy, Zap } from "lucide-react";

const sports = [
  { name: "Football", icon: Trophy, live: 428, note: "Match winner, goals, corners, cards" },
  { name: "Basketball", icon: Activity, live: 96, note: "Moneyline, totals, spreads" },
  { name: "Tennis", icon: Target, live: 72, note: "Sets, games, aces" },
  { name: "eSports", icon: Zap, live: 51, note: "Maps, rounds, props" },
];

export const Route = createFileRoute("/sports")({
  component: SportsPage,
});

function SportsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Sports hub</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Browse every market</h1>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Back home
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          {sports.map((sport) => (
            <article
              key={sport.name}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <sport.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold">{sport.name}</h2>
                    <p className="text-sm text-muted-foreground">{sport.note}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums text-primary">
                  {sport.live}
                </span>
              </div>
              <button className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                Open markets <ChevronRight className="h-4 w-4" />
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
