import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type LucideIcon } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarRange,
  ChevronRight,
  Clock,
  Coins,
  Filter,
  LayoutDashboard,
  LineChart,
  LockKeyhole,
  Megaphone,
  Plus,
  MoonStar,
  Radio,
  Search,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  TrendingUp,
  User,
  Wallet,
  SunMedium,
  X,
  Zap,
} from "lucide-react";
import { useAppStore } from "../lib/app-state";
import { getCorrectScoreOptions, getTotalsOptions } from "../lib/market-utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "W&T Bet - Smart Sports Betting Platform" },
      {
        name: "description",
        content:
          "W&T Bet is a clean, organized sports betting platform with live odds, in-play markets, admin tools, and clear account flows.",
      },
      { property: "og:title", content: "W&T Bet - Smart Sports Betting Platform" },
      {
        property: "og:description",
        content:
          "Live odds, advanced markets, and a premium betting experience built for clarity and trust.",
      },
    ],
  }),
  component: Index,
});

type Selection = {
  id: string;
  matchId: string;
  match: string;
  market: string;
  marketType: "match-result" | "correct-score" | "over-under";
  selection: string;
  line?: number;
  pick: string;
  odds: number;
};

type SportItem = {
  name: string;
  icon: LucideIcon;
  count: number;
};

type LiveMatch = {
  id: string;
  league: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  minute: string;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
};

type FeaturedMatch = {
  id: string;
  league: string;
  home: string;
  away: string;
  time: string;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
};

type InsightCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  points: string[];
};

const sports: SportItem[] = [
  { name: "Football", icon: Trophy, count: 428 },
  { name: "Basketball", icon: Activity, count: 96 },
  { name: "Tennis", icon: Target, count: 72 },
  { name: "Cricket", icon: LineChart, count: 34 },
  { name: "Baseball", icon: CalendarRange, count: 28 },
  { name: "eSports", icon: Zap, count: 51 },
  { name: "MMA", icon: Shield, count: 12 },
  { name: "Horse Racing", icon: Star, count: 44 },
];

const liveMatches: LiveMatch[] = [
  {
    id: "l1",
    league: "Premier League",
    home: "Arsenal",
    away: "Chelsea",
    homeScore: 2,
    awayScore: 1,
    minute: "67'",
    odds: { home: 1.85, draw: 3.4, away: 4.2 },
  },
  {
    id: "l2",
    league: "La Liga",
    home: "Real Madrid",
    away: "Barcelona",
    homeScore: 1,
    awayScore: 1,
    minute: "41'",
    odds: { home: 2.1, draw: 3.1, away: 3.5 },
  },
  {
    id: "l3",
    league: "Serie A",
    home: "Inter",
    away: "Juventus",
    homeScore: 0,
    awayScore: 0,
    minute: "23'",
    odds: { home: 2.4, draw: 2.9, away: 3.2 },
  },
  {
    id: "l4",
    league: "Bundesliga",
    home: "Bayern",
    away: "Dortmund",
    homeScore: 3,
    awayScore: 2,
    minute: "78'",
    odds: { home: 1.35, draw: 5.2, away: 7.5 },
  },
];

const featuredMatches: FeaturedMatch[] = [
  {
    id: "u1",
    league: "Champions League",
    home: "Man City",
    away: "PSG",
    time: "Today 20:00",
    odds: { home: 1.95, draw: 3.6, away: 3.8 },
  },
  {
    id: "u2",
    league: "NBA",
    home: "Lakers",
    away: "Celtics",
    time: "Tomorrow 02:30",
    odds: { home: 2.05, draw: 15, away: 1.82 },
  },
  {
    id: "u3",
    league: "ATP Finals",
    home: "Alcaraz",
    away: "Sinner",
    time: "Today 21:00",
    odds: { home: 1.75, draw: 0, away: 2.15 },
  },
  {
    id: "u4",
    league: "Ligue 1",
    home: "PSG",
    away: "Marseille",
    time: "Sat 19:00",
    odds: { home: 1.55, draw: 4.1, away: 5.6 },
  },
];

const insightCards: InsightCard[] = [
  {
    title: "Admin match control",
    description: "Create local matches, set fixed outcomes, and keep settlement synchronized.",
    icon: LayoutDashboard,
    points: [
      "Manual local match creation",
      "Scheduled score progression",
      "Instant ticket settlement",
    ],
  },
  {
    title: "KYC verification",
    description: "Guide users through identity checks before withdrawals are unlocked.",
    icon: BadgeCheck,
    points: ["ID upload", "Address proof", "Withdrawal access gate"],
  },
  {
    title: "Notifications and alerts",
    description: "Keep bettors informed with match starts, score changes, and odds movement.",
    icon: Bell,
    points: ["Match start alerts", "Live score nudges", "Odds change watchlist"],
  },
  {
    title: "Responsible gambling",
    description: "Provide visible tools for limits, self-exclusion, and support resources.",
    icon: Shield,
    points: ["Deposit limits", "Self-exclusion tools", "Support and help links"],
  },
];

const activityItems = [
  { label: "Active users", value: "1.2M+" },
  { label: "Daily markets", value: "40k+" },
  { label: "KYC completion", value: "96%" },
  { label: "Payout speed", value: "Instant" },
];

function Index() {
  const {
    currentUser,
    theme,
    setTheme,
    placeAccumulatorBet,
    matches,
    signOut,
    toggleWatchlistMatch,
  } = useAppStore();
  const [slip, setSlip] = useState<Selection[]>([]);
  const [stake, setStake] = useState<string>("10");
  const [slipOpen, setSlipOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState(sports[0].name);
  const [selectedFilter, setSelectedFilter] = useState("Live now");
  const [selectedFeed, setSelectedFeed] = useState("Popular");
  const [searchQuery, setSearchQuery] = useState("");

  const totalOdds = useMemo(() => slip.reduce((acc, selection) => acc * selection.odds, 1), [slip]);
  const stakeValue = Number(stake) || 0;
  const payout = stakeValue * totalOdds;
  const balance = currentUser?.balance ?? 0;
  const accountStatus = currentUser?.kycStatus ?? "unverified";
  const accountItems = [
    { label: "Balance", value: `$${balance.toFixed(2)}`, icon: Wallet },
    {
      label: "Verification",
      value: accountStatus === "verified" ? "Verified" : "Pending documents",
      icon: LockKeyhole,
    },
    { label: "Withdrawal fee", value: "10% of winnings", icon: Coins },
    { label: "Support", value: "Live 24/7", icon: Radio },
  ];

  const addSelection = (selection: Selection) => {
    setSlip((current) => {
      const exists = current.some((item) => item.id === selection.id);
      return exists ? current.filter((item) => item.id !== selection.id) : [...current, selection];
    });
    setSlipOpen(true);
  };

  const isSelected = (id: string) => slip.some((selection) => selection.id === id);
  const isWatching = (matchId: string) =>
    currentUser?.watchlistMatchIds?.includes(matchId) ?? false;
  const marketCount = slip.reduce(
    (acc, item) => {
      acc[item.marketType] += 1;
      return acc;
    },
    { "match-result": 0, "correct-score": 0, "over-under": 0 },
  );
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const combined = [...liveMatches, ...featuredMatches].filter((item) => {
      const text = `${item.league} ${item.home} ${item.away}`.toLowerCase();
      return text.includes(query);
    });

    return combined.slice(0, 5);
  }, [searchQuery]);
  const searchSuggestions = [
    "Premier League",
    "Champions League",
    "Arsenal",
    "Man City",
    "NBA",
  ];
  const searchPanel = searchQuery.trim() ? (
    searchResults.length > 0 ? (
      <div className="absolute right-0 top-11 z-50 w-[24rem] overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
        <div className="border-b border-border bg-surface px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Search results
        </div>
        <div className="max-h-80 divide-y divide-border overflow-auto">
          {searchResults.map((match) => (
            <div key={`${match.league}-${match.home}-${match.away}`} className="p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {match.league}
              </div>
              <div className="mt-1 font-semibold">
                {match.home} vs {match.away}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{match.minute}</span>
                <span>
                  {match.odds.home.toFixed(2)} / {match.odds.draw.toFixed(2)} /{" "}
                  {match.odds.away.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="absolute right-0 top-11 z-50 w-[24rem] rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-elegant">
        No matches found for "{searchQuery}".
      </div>
    )
  ) : (
    <div className="absolute right-0 top-11 z-50 w-[24rem] overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
      <div className="border-b border-border bg-surface px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        Popular searches
      </div>
      <div className="flex flex-wrap gap-2 p-4">
        {searchSuggestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSearchQuery(item)}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-secondary"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-elegant">
              <span className="font-display text-lg font-bold text-primary-foreground">W</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold tracking-tight">W&amp;T Bet</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
                Clear markets. Smarter play.
              </span>
            </div>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {[
              { label: "Sports", to: "/sports" },
              { label: "Live", to: "/live" },
              { label: "Promotions", to: "/promotions" },
              { label: "Help", to: "/help" },
            ].map((item, index) => (
              <Link
                key={item.label}
                to={item.to}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  index === 0
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {item.label}
                {index === 1 ? (
                  <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-live pulse-live" />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden xl:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search teams, leagues, markets"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-9 w-80 rounded-lg border border-input bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              {searchPanel}
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
              <Bell className="h-4 w-4" />
            </button>
            {currentUser ? (
              <>
                <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 sm:flex">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Balance
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      ${currentUser.balance.toFixed(2)}
                    </span>
                  </div>
                </div>
                {currentUser.role === "admin" ? (
                  <Link
                    to="/admin"
                    className="hidden rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-secondary sm:block"
                  >
                    Admin
                  </Link>
                ) : null}
                <Link
                  to="/account"
                  className="hidden rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-secondary sm:block"
                >
                  Account
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="hidden rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-secondary sm:block"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/account"
                className="hidden rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-secondary sm:block"
              >
                Sign in
              </Link>
            )}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:bg-secondary"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <SunMedium className="h-4 w-4" />
              ) : (
                <MoonStar className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <Link
              to="/account"
              className="rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.02]"
            >
              Join now
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_340px]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Trophy className="h-3.5 w-3.5" />
                  Sports
                </h3>
                <ul className="space-y-0.5">
                  {sports.map((sport) => (
                    <li key={sport.name}>
                      <button
                        type="button"
                        onClick={() => setSelectedSport(sport.name)}
                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors ${
                          selectedSport === sport.name
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <sport.icon className="h-4 w-4" />
                          <span className="font-medium">{sport.name}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{sport.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-success" />
                  <span className="text-sm font-semibold">Trust and security</span>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Encrypted accounts, KYC-gated withdrawals, and visible controls for safe,
                  responsible betting.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold">Quick filters</span>
                </div>
                <div className="space-y-2">
                  {["Live now", "Today", "Favorites", "High odds"].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setSelectedFilter(filter)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                        selectedFilter === filter
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-surface text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{filter}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="min-w-0 space-y-6">
            <section className="relative overflow-hidden rounded-2xl bg-gradient-hero p-5 shadow-elegant lg:p-6">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
              <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary-glow/25 blur-3xl" />
              <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-start">
                <div className="max-w-2xl text-primary-foreground">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5" />
                    W&amp;T Bet - live wagering, account control, and admin tools
                  </div>
                  <h1 className="max-w-xl font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-[2.55rem]">
                    A betting dashboard that stays clear, compact, and ready to use.
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-[15px]">
                    Browse live odds, check account status, and move between betting and admin
                    screens without the oversized landing-page feel.
                  </p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-white/65">
                    Browsing {selectedSport} · {selectedFilter.toLowerCase()}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <Link
                      to="/sports"
                      className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary shadow-lg transition-transform hover:scale-[1.02]"
                    >
                      Explore markets <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/live"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/15"
                    >
                      <Radio className="h-4 w-4" />
                      Watch live
                    </Link>
                  </div>
                  <div className="mt-5 grid max-w-2xl grid-cols-2 gap-3 border-t border-white/15 pt-4 sm:grid-cols-4">
                    {activityItems.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-white/10 bg-white/5 p-3"
                      >
                        <div className="font-display text-lg font-bold">{item.value}</div>
                        <div className="text-[10px] uppercase tracking-wider text-white/70">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {accountItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/15 bg-white/10 p-3.5 text-primary-foreground backdrop-blur"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-white/70">
                            {item.label}
                          </div>
                          <div className="mt-1 font-display text-base font-bold sm:text-lg">
                            {item.value}
                          </div>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                          <item.icon className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-live/10 px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-live pulse-live" />
                    <span className="text-xs font-bold uppercase tracking-wider text-live">
                      Live now
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-bold">In-play matches</h2>
                </div>
                <Link
                  to="/live"
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  View all <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {liveMatches.map((match) => (
                  <article
                    key={match.id}
                    className="group rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:border-primary/40 hover:shadow-elegant"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-muted-foreground">{match.league}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleWatchlistMatch(match.id)}
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                            isWatching(match.id)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-surface text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {isWatching(match.id) ? "Watching" : "Watch"}
                        </button>
                        <span className="flex items-center gap-1.5 font-semibold text-live">
                          <Clock className="h-3 w-3" />
                          {match.minute}
                        </span>
                      </div>
                    </div>
                    <div className="mb-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{match.home}</span>
                        <span className="font-display text-lg font-bold tabular-nums">
                          {match.homeScore}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{match.away}</span>
                        <span className="font-display text-lg font-bold tabular-nums">
                          {match.awayScore}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["home", "draw", "away"] as const).map((market) => {
                        const id = `${match.id}-${market}`;
                        const label = market === "home" ? "1" : market === "draw" ? "X" : "2";
                        const value =
                          market === "home" ? match.home : market === "away" ? match.away : "Draw";
                        const active = isSelected(id);

                        return (
                          <button
                            key={market}
                            onClick={() =>
                              addSelection({
                                id,
                                matchId: match.id,
                                match: `${match.home} vs ${match.away}`,
                                market: "Match result",
                                selection: market,
                                pick: value,
                                odds: match.odds[market],
                              })
                            }
                            className={`flex flex-col items-center rounded-lg border px-2 py-2 text-sm transition-all ${
                              active
                                ? "border-primary bg-primary text-primary-foreground shadow-glow"
                                : "border-border bg-surface hover:border-primary/40 hover:bg-primary/5"
                            }`}
                          >
                            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                              {label}
                            </span>
                            <span className="font-display font-bold tabular-nums">
                              {match.odds[market].toFixed(2)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {getCorrectScoreOptions(match)
                        .slice(0, 4)
                        .map((option) => {
                          const id = `${match.id}-cs-${option.scoreline}`;
                          const active = isSelected(id);
                          return (
                            <button
                              key={option.scoreline}
                              type="button"
                              onClick={() =>
                                addSelection({
                                  id,
                                  matchId: match.id,
                                  match: `${match.home} vs ${match.away}`,
                                  market: "Correct score",
                                  marketType: "correct-score",
                                  selection: option.scoreline,
                                  pick: option.scoreline,
                                  odds: option.odds,
                                })
                              }
                              className={`rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                                active
                                  ? "border-primary bg-primary text-primary-foreground shadow-glow"
                                  : "border-border bg-surface hover:border-primary/40 hover:bg-primary/5"
                              }`}
                            >
                              <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                                Correct score
                              </div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <span className="font-display font-bold">{option.scoreline}</span>
                                <span className="font-display font-bold tabular-nums">
                                  {option.odds.toFixed(2)}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {getTotalsOptions(match).map((option) => {
                        const overId = `${match.id}-ou-over-${option.line}`;
                        const underId = `${match.id}-ou-under-${option.line}`;
                        return (
                          <div key={option.line} className="grid grid-cols-2 gap-1.5">
                            {[
                              { id: overId, label: "Over", odds: option.over, selection: "over" },
                              { id: underId, label: "Under", odds: option.under, selection: "under" },
                            ].map((entry) => {
                              const active = isSelected(entry.id);
                              return (
                                <button
                                  key={entry.id}
                                  type="button"
                                  onClick={() =>
                                    addSelection({
                                      id: entry.id,
                                      matchId: match.id,
                                      match: `${match.home} vs ${match.away}`,
                                      market: `Totals ${option.line.toFixed(1)}`,
                                      marketType: "over-under",
                                      selection: entry.selection,
                                      line: option.line,
                                      pick: `${entry.label} ${option.line.toFixed(1)}`,
                                      odds: entry.odds,
                                    })
                                  }
                                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                                    active
                                      ? "border-primary bg-primary text-primary-foreground shadow-glow"
                                      : "border-border bg-surface hover:border-primary/40 hover:bg-primary/5"
                                  }`}
                                >
                                  <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                                    {entry.label} {option.line.toFixed(1)}
                                  </div>
                                  <div className="mt-1 flex items-center justify-between gap-2">
                                    <span className="font-display font-bold">{entry.label}</span>
                                    <span className="font-display font-bold tabular-nums">
                                      {entry.odds.toFixed(2)}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent" />
                  <h2 className="font-display text-xl font-bold">Featured events</h2>
                </div>
                <div className="flex gap-1 rounded-lg border border-border bg-surface p-0.5">
                  {["Popular", "Today", "Tomorrow", "Week"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedFeed(tab)}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        selectedFeed === tab
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
                <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border bg-surface px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
                  <span>Event</span>
                  <span className="w-16 text-center">1</span>
                  <span className="w-16 text-center">X</span>
                  <span className="w-16 text-center">2</span>
                </div>
                <ul className="divide-y divide-border">
                  {featuredMatches.map((match) => (
                    <li
                      key={match.id}
                      className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-secondary/40 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-4"
                    >
                      <div>
                        <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          <span>{match.league}</span>
                          <span>•</span>
                          <span>{match.time}</span>
                        </div>
                        <div className="text-sm font-semibold">
                          {match.home} <span className="text-muted-foreground">vs</span>{" "}
                          {match.away}
                        </div>
                      </div>
                      {(["home", "draw", "away"] as const).map((market) => {
                        const odds = match.odds[market];
                        const disabled = odds === 0;
                        const id = `${match.id}-${market}`;
                        const active = isSelected(id);
                        const pick =
                          market === "home" ? match.home : market === "away" ? match.away : "Draw";

                        return (
                          <button
                            key={market}
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              !disabled &&
                              addSelection({
                                id,
                                matchId: match.id,
                                match: `${match.home} vs ${match.away}`,
                                market: "Match result",
                                selection: market,
                                pick,
                                odds,
                              })
                            }
                            className={`h-11 w-full rounded-lg border font-display font-bold tabular-nums transition-all sm:w-16 ${
                              disabled
                                ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-50"
                                : active
                                  ? "border-primary bg-primary text-primary-foreground shadow-glow"
                                  : "border-border bg-surface hover:border-primary/40 hover:bg-primary/5"
                            }`}
                          >
                            {disabled ? "N/A" : odds.toFixed(2)}
                          </button>
                        );
                      })}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              {insightCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-xl border border-border bg-card p-5 shadow-card"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold">{card.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {card.description}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm">
                    {card.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </section>
          </main>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <BetSlip
                slip={slip}
                stake={stake}
                setStake={setStake}
                totalOdds={totalOdds}
                payout={payout}
                marketCount={marketCount}
                onPlaceBet={async () => {
                  await placeAccumulatorBet({
                    stake: stakeValue,
                    selections: slip.map((selection) => ({
                      matchId: selection.matchId,
                      marketType: selection.marketType,
                      selection: selection.selection,
                      line: selection.line,
                    })),
                  });
                  setSlip([]);
                }}
                onRemove={(id) =>
                  setSlip((current) => current.filter((selection) => selection.id !== id))
                }
                onClear={() => setSlip([])}
              />

              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="mb-3 flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-accent" />
                  <h3 className="font-display text-sm font-bold">Alerts and reminders</h3>
                </div>
                <div className="space-y-2">
                  {[
                    "Kickoff alerts for favorite matches",
                    "Odds movement watchlist",
                    "Withdrawal review notification",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-lg border border-border/70 bg-surface px-3 py-2 text-sm"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-live" />
                  <h3 className="font-display text-sm font-bold">Withdrawal policy</h3>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  The fee reminder is visible before cash-out: 10% of winnings is settled prior to
                  withdrawal approval.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {slip.length > 0 ? (
        <button
          onClick={() => setSlipOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elegant lg:hidden"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
            {slip.length}
          </span>
          Bet slip - {payout.toFixed(2)}
        </button>
      ) : null}

      {slipOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSlipOpen(false)}>
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-auto rounded-t-2xl bg-background p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <BetSlip
              slip={slip}
              stake={stake}
              setStake={setStake}
              totalOdds={totalOdds}
              payout={payout}
              marketCount={marketCount}
              onPlaceBet={async () => {
                await placeAccumulatorBet({
                  stake: stakeValue,
                  selections: slip.map((selection) => ({
                    matchId: selection.matchId,
                    marketType: selection.marketType,
                    selection: selection.selection,
                    line: selection.line,
                  })),
                });
                setSlip([]);
              }}
              onRemove={(id) =>
                setSlip((current) => current.filter((selection) => selection.id !== id))
              }
              onClear={() => setSlip([])}
            />
          </div>
        </div>
      ) : null}

      <footer className="mt-12 border-t border-border bg-surface">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            18+ Play responsibly. Gambling can be addictive.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/help" className="hover:text-foreground">
              Terms
            </Link>
            <Link to="/help" className="hover:text-foreground">
              Privacy
            </Link>
            <Link to="/help" className="hover:text-foreground">
              Responsible Gambling
            </Link>
            <span>Copyright 2026 W&amp;T Bet</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BetSlip({
  slip,
  stake,
  setStake,
  totalOdds,
  payout,
  marketCount,
  onPlaceBet,
  onRemove,
  onClear,
}: {
  slip: Selection[];
  stake: string;
  setStake: (value: string) => void;
  totalOdds: number;
  payout: number;
  marketCount: { "match-result": number; "correct-score": number; "over-under": number };
  onPlaceBet: () => Promise<void>;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary text-primary-foreground">
            <span className="text-xs font-bold">{slip.length}</span>
          </div>
          <h3 className="font-display text-sm font-bold">Bet slip</h3>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {marketCount["match-result"]} result · {marketCount["correct-score"]} correct score ·{" "}
          {marketCount["over-under"]} totals
        </div>
        {slip.length > 0 ? (
          <button
            onClick={onClear}
            className="text-xs font-medium text-muted-foreground hover:text-destructive"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {slip.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Your slip is empty</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap odds to add selections to your bet slip.
          </p>
        </div>
      ) : (
        <>
          <ul className="max-h-[320px] divide-y divide-border overflow-auto">
            {slip.map((selection) => (
              <li key={selection.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {selection.market}
                    </div>
                    <div className="mt-0.5 truncate text-sm font-semibold">{selection.pick}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {selection.match}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-display text-sm font-bold tabular-nums text-primary">
                      {selection.odds.toFixed(2)}
                    </span>
                    <button
                      onClick={() => onRemove(selection.id)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="space-y-3 border-t border-border p-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Stake
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  value={stake}
                  onChange={(event) => setStake(event.target.value)}
                  min="0"
                  className="h-10 w-full rounded-lg border border-input bg-surface pl-7 pr-3 text-sm font-semibold tabular-nums outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {[10, 25, 50, 100].map((value) => (
                  <button
                    key={value}
                    onClick={() => setStake(String(value))}
                    className="rounded-md border border-border bg-surface py-1 text-xs font-medium hover:border-primary/40 hover:bg-primary/5"
                  >
                    ${value}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 rounded-lg bg-surface p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total odds</span>
                <span className="font-display font-bold tabular-nums">{totalOdds.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Selections</span>
                <span className="font-semibold tabular-nums">{slip.length}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
                <span className="text-sm font-semibold">Potential payout</span>
                <span className="font-display text-lg font-bold tabular-nums text-success">
                  ${payout.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void onPlaceBet()}
              className="w-full rounded-lg bg-gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.01]"
            >
              Place bet
            </button>
            <p className="text-center text-[10px] text-muted-foreground">
              By placing this bet you agree to our terms. A 10% service fee applies on withdrawals
              of winnings.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
