import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BadgeCheck, BanknoteArrowDown, CalendarClock, Shield, Trophy } from "lucide-react";
import { useAppStore } from "../lib/app-state";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const {
    currentUser,
    users,
    matches,
    bets,
    withdrawals,
    createLocalMatch,
    updateMatch,
    settleMatch,
    approveWithdrawal,
    rejectWithdrawal,
  } = useAppStore();

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-card">
          <h1 className="font-display text-2xl font-bold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with the admin account to manage matches, withdrawals, and settlements.
          </p>
          <Link
            to="/account"
            className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Go to account
          </Link>
        </div>
      </main>
    );
  }

  return <AdminShell />;
}

function AdminShell() {
  const {
    users,
    matches,
    bets,
    withdrawals,
    createLocalMatch,
    updateMatch,
    settleMatch,
    approveWithdrawal,
    rejectWithdrawal,
  } = useAppStore();

  const [sport, setSport] = useState("Football");
  const [league, setLeague] = useState("Local League");
  const [home, setHome] = useState("Team A");
  const [away, setAway] = useState("Team B");
  const [homeOdds, setHomeOdds] = useState("1.90");
  const [drawOdds, setDrawOdds] = useState("3.20");
  const [awayOdds, setAwayOdds] = useState("3.60");
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id ?? "");

  const stats = useMemo(
    () => [
      { label: "Users", value: users.length },
      { label: "Matches", value: matches.length },
      { label: "Open bets", value: bets.filter((bet) => bet.status === "open").length },
      { label: "Withdrawals", value: withdrawals.length },
    ],
    [bets, matches.length, users.length, withdrawals.length],
  );

  const createMatch = () => {
    createLocalMatch({
      sport,
      league,
      home,
      away,
      minute: "20:00",
      score: "-",
      homeOdds: Number(homeOdds),
      drawOdds: Number(drawOdds),
      awayOdds: Number(awayOdds),
      featured: true,
      live: false,
    });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Admin</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Operations dashboard</h1>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Back home
          </Link>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {item.label}
              </div>
              <div className="mt-2 font-display text-3xl font-bold">{item.value}</div>
            </div>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Create local match</h2>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                Sport
                <input
                  value={sport}
                  onChange={(event) => setSport(event.target.value)}
                  className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                League
                <input
                  value={league}
                  onChange={(event) => setLeague(event.target.value)}
                  className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Home
                  <input
                    value={home}
                    onChange={(event) => setHome(event.target.value)}
                    className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Away
                  <input
                    value={away}
                    onChange={(event) => setAway(event.target.value)}
                    className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-medium">
                  Home odds
                  <input
                    value={homeOdds}
                    onChange={(event) => setHomeOdds(event.target.value)}
                    className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Draw odds
                  <input
                    value={drawOdds}
                    onChange={(event) => setDrawOdds(event.target.value)}
                    className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Away odds
                  <input
                    value={awayOdds}
                    onChange={(event) => setAwayOdds(event.target.value)}
                    className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={createMatch}
                className="rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                Add match
              </button>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                <h2 className="font-display text-xl font-bold">Match control</h2>
              </div>
              <div className="mt-4 space-y-3">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className={`rounded-xl border bg-surface p-4 ${
                      selectedMatchId === match.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          {match.home} vs {match.away}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {match.league} · {match.sport} · {match.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedMatchId(match.id)}
                          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium"
                        >
                          Select
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateMatch(match.id, {
                              live: !match.live,
                              status: match.live ? "upcoming" : "live",
                            })
                          }
                          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium"
                        >
                          {match.live ? "Pause live" : "Go live"}
                        </button>
                        <button
                          type="button"
                          onClick={() => settleMatch({ matchId: match.id, result: "home" })}
                          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                        >
                          Settle home
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <span className="rounded-lg bg-card px-3 py-2">
                        1 {match.homeOdds.toFixed(2)}
                      </span>
                      <span className="rounded-lg bg-card px-3 py-2">
                        X {match.drawOdds.toFixed(2)}
                      </span>
                      <span className="rounded-lg bg-card px-3 py-2">
                        2 {match.awayOdds.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center gap-2">
                  <BanknoteArrowDown className="h-5 w-5 text-live" />
                  <h2 className="font-display text-xl font-bold">Withdrawal queue</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {withdrawals.length > 0 ? (
                    withdrawals.map((item) => (
                      <div key={item.id} className="rounded-xl border border-border bg-surface p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold">${item.amount.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              Fee ${item.serviceFee.toFixed(2)} · Net ${item.netAmount.toFixed(2)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => approveWithdrawal(item.id)}
                              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectWithdrawal(item.id)}
                              className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No withdrawals waiting.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl font-bold">User roster</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="rounded-xl border border-border bg-surface p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                        <div className="text-right text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {user.role}
                          <div className="mt-1 capitalize">{user.kycStatus}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
