import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, ChevronRight, Target, Trophy, Zap } from "lucide-react";

const hierarchy = [
  {
    sport: "Football",
    country: "England",
    competition: "Premier League",
    fixtures: "18 live fixtures",
    trend: [18, 22, 25, 21, 28, 34, 31],
  },
  {
    sport: "Football",
    country: "Europe",
    competition: "Champions League",
    fixtures: "12 live fixtures",
    trend: [12, 14, 16, 13, 18, 20, 19],
  },
  {
    sport: "Basketball",
    country: "USA",
    competition: "NBA",
    fixtures: "9 live fixtures",
    trend: [10, 12, 11, 13, 15, 14, 16],
  },
  {
    sport: "Tennis",
    country: "Global",
    competition: "ATP/WTA Tour",
    fixtures: "21 live fixtures",
    trend: [8, 10, 9, 12, 14, 15, 17],
  },
];

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

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Sport {'>'} Country {'>'} Competition {'>'} Fixture
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold">Structured market navigation</h2>
            </div>
            <Link
              to="/live"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              Open live board <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {hierarchy.map((item) => (
              <article
                key={`${item.sport}-${item.competition}`}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      {item.sport}
                    </div>
                    <h3 className="mt-1 font-display text-lg font-bold">{item.competition}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.country}</p>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {item.fixtures}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Odds movement</span>
                    <span>7 day trend</span>
                  </div>
                  <TrendBar values={item.trend} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function TrendBar({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  return (
    <div className="grid grid-cols-7 items-end gap-1.5">
      {values.map((value, index) => {
        const height = 24 + ((value - min) / range) * 44;
        return (
          <div key={`${index}-${value}`} className="flex flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md bg-gradient-primary/90"
              style={{ height: `${height}px` }}
            />
            <span className="text-[10px] text-muted-foreground">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
