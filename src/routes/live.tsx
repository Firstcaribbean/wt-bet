import { Link, createFileRoute } from "@tanstack/react-router";
import { Clock, Radio, TrendingUp } from "lucide-react";

const liveMatches = [
  { league: "Premier League", match: "Arsenal vs Chelsea", minute: "67'", status: "2-1" },
  { league: "La Liga", match: "Real Madrid vs Barcelona", minute: "41'", status: "1-1" },
  { league: "Serie A", match: "Inter vs Juventus", minute: "23'", status: "0-0" },
];

export const Route = createFileRoute("/live")({
  component: LivePage,
});

function LivePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Live board</p>
            <h1 className="mt-2 font-display text-3xl font-bold">In-play action</h1>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Back home
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="space-y-3">
            {liveMatches.map((item) => (
              <article
                key={item.match}
                className="rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{item.league}</span>
                  <span className="flex items-center gap-1 text-live">
                    <Clock className="h-3.5 w-3.5" />
                    {item.minute}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-bold">{item.match}</h2>
                    <p className="text-sm text-muted-foreground">Current score is updating live</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    {item.status}
                  </span>
                </div>
              </article>
            ))}
          </section>

          <aside className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-live" />
              <h2 className="font-display text-lg font-bold">Live controls</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              This page gives you a real destination for the top nav and hero CTA, instead of a dead
              placeholder.
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-surface p-3 text-sm">
              <TrendingUp className="h-4 w-4 text-accent" />
              Odds and scores can be connected here next.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
