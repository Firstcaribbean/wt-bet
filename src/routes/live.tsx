import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Clock, Radio, Sparkles, TrendingUp } from "lucide-react";
import { fetchFootballFeedAction } from "../lib/app-backend.server";
import { useAppStore } from "../lib/app-state";
import type { FootballFeedItem } from "../lib/app-model";

export const Route = createFileRoute("/live")({
  loader: () => fetchFootballFeedAction(),
  component: LivePage,
});

function LivePage() {
  const { matches } = useAppStore();
  const feed = Route.useLoaderData() as {
    provider: "football-data" | "fallback";
    items: FootballFeedItem[];
    updatedAt: string;
    note?: string;
  };

  const localSimulations = useMemo(
    () => matches.filter((match) => match.source === "local" && match.simulation),
    [matches],
  );

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

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-live" />
                  <h2 className="font-display text-lg font-bold">Real football feed</h2>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {feed.provider === "football-data" ? "football-data.org" : "Local fallback"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {feed.note ??
                  "Live football data is coming from a free provider-backed API through the backend, so the token stays private."}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Updated {new Date(feed.updatedAt).toLocaleTimeString()}
              </p>
            </div>

            {feed.items.length > 0 ? (
              feed.items.map((item) => (
                <article
                  key={item.id}
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
                      <h2 className="font-display text-lg font-bold">
                        {item.home} <span className="text-muted-foreground">vs</span> {item.away}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Score {item.score} - {item.status}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                      {item.source === "football-data" ? "Live data" : "Local"}
                    </span>
                  </div>
                  {item.kickoff ? (
                    <p className="mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Kickoff {item.kickoff}
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground">
                  No football data came back yet. Add the free football-data.org token in Vercel
                  env vars and refresh.
                </p>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <h2 className="font-display text-lg font-bold">Local simulation</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Matches created by the admin now move through a visible simulation, then settle
                automatically.
              </p>
            </div>

            <div className="space-y-3">
              {localSimulations.length > 0 ? (
                localSimulations.map((match) => {
                  const simulation = match.simulation!;
                  const startedAt = new Date(simulation.startedAt).getTime();
                  const progress = Math.min(
                    100,
                    Math.max(
                      0,
                      ((Date.now() - startedAt) / (simulation.durationMinutes * 60000)) * 100,
                    ),
                  );

                  return (
                    <article
                      key={match.id}
                      className="rounded-2xl border border-border bg-card p-5 shadow-card"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                            Simulation
                          </div>
                          <h3 className="mt-1 font-display text-lg font-bold">
                            {match.home} vs {match.away}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {match.league} - {match.status}
                          </p>
                        </div>
                        <span className="rounded-full bg-live/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-live">
                          {simulation.status}
                        </span>
                      </div>

                      <div className="mt-4 rounded-xl bg-surface p-3">
                        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{match.minute}</span>
                          <span>{match.score}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-border">
                          <div
                            className="h-full rounded-full bg-gradient-primary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Progress {progress.toFixed(0)}%
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <p className="text-sm text-muted-foreground">
                    Create a local match in admin and it will appear here with a running simulation
                    bar.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                <h2 className="font-display text-lg font-bold">Next step</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Once you add the free football-data.org token in Vercel, this page will show real
                live football games while the admin-created match simulation keeps running beside
                it.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
