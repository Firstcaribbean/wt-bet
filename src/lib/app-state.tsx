import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "user" | "admin";
export type KycStatus = "unverified" | "pending" | "verified";
export type MatchStatus = "upcoming" | "live" | "settled";
export type BetStatus = "open" | "won" | "lost";
export type WithdrawalStatus = "requested" | "approved" | "rejected";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  balance: number;
  kycStatus: KycStatus;
  createdAt: string;
};

export type Match = {
  id: string;
  sport: string;
  league: string;
  home: string;
  away: string;
  status: MatchStatus;
  minute: string;
  score: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  featured: boolean;
  live: boolean;
  settledResult?: "home" | "draw" | "away";
};

export type Bet = {
  id: string;
  userId: string;
  matchId: string;
  kind: "single" | "accumulator";
  selection: "home" | "draw" | "away";
  pick: string;
  stake: number;
  odds: number;
  potentialPayout: number;
  status: BetStatus;
  placedAt: string;
  legs: Array<{
    matchId: string;
    selection: "home" | "draw" | "away";
    pick: string;
    odds: number;
  }>;
};

export type Withdrawal = {
  id: string;
  userId: string;
  amount: number;
  serviceFee: number;
  netAmount: number;
  status: WithdrawalStatus;
  createdAt: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

type StoreShape = {
  hydrated: boolean;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  users: User[];
  currentUserId: string | null;
  currentUser: User | null;
  matches: Match[];
  bets: Bet[];
  withdrawals: Withdrawal[];
  notifications: Notification[];
  signUp: (input: { name: string; email: string; password: string }) => string;
  signIn: (input: { email: string; password: string }) => string;
  signOut: () => void;
  placeBet: (input: {
    matchId: string;
    selection: "home" | "draw" | "away";
    stake: number;
  }) => string;
  placeAccumulatorBet: (input: {
    selections: Array<{ matchId: string; selection: "home" | "draw" | "away" }>;
    stake: number;
  }) => string;
  requestWithdrawal: (amount: number) => string;
  verifyKyc: () => void;
  createLocalMatch: (input: Omit<Match, "id" | "status"> & { status?: MatchStatus }) => string;
  updateMatch: (id: string, patch: Partial<Match>) => void;
  settleMatch: (input: { matchId: string; result: "home" | "draw" | "away" }) => void;
  approveWithdrawal: (id: string) => void;
  rejectWithdrawal: (id: string) => void;
};

const STORAGE_KEY = "wt-bet-app-state";

const adminUser: User = {
  id: "admin-1",
  name: "W&T Admin",
  email: "admin@wtbet.local",
  password: "admin123",
  role: "admin",
  balance: 100000,
  kycStatus: "verified",
  createdAt: new Date().toISOString(),
};

const seedUsers: User[] = [
  adminUser,
  {
    id: "user-1",
    name: "Demo Bettor",
    email: "player@wtbet.local",
    password: "player123",
    role: "user",
    balance: 1248.5,
    kycStatus: "pending",
    createdAt: new Date().toISOString(),
  },
];

const seedMatches: Match[] = [
  {
    id: "match-1",
    sport: "Football",
    league: "Premier League",
    home: "Arsenal",
    away: "Chelsea",
    status: "live",
    minute: "67'",
    score: "2-1",
    homeOdds: 1.85,
    drawOdds: 3.4,
    awayOdds: 4.2,
    featured: true,
    live: true,
  },
  {
    id: "match-2",
    sport: "Football",
    league: "Champions League",
    home: "Man City",
    away: "PSG",
    status: "upcoming",
    minute: "20:00",
    score: "-",
    homeOdds: 1.95,
    drawOdds: 3.6,
    awayOdds: 3.8,
    featured: true,
    live: false,
  },
  {
    id: "match-3",
    sport: "Basketball",
    league: "NBA",
    home: "Lakers",
    away: "Celtics",
    status: "upcoming",
    minute: "02:30",
    score: "-",
    homeOdds: 2.05,
    drawOdds: 15,
    awayOdds: 1.82,
    featured: false,
    live: false,
  },
];

const seedBets: Bet[] = [];
const seedWithdrawals: Withdrawal[] = [];
const seedNotifications: Notification[] = [
  {
    id: "n-1",
    title: "Welcome to W&T Bet",
    message: "Sign in, verify your account, and start placing bets.",
    createdAt: new Date().toISOString(),
  },
];

const defaultState = {
  hydrated: false,
  theme: "dark" as const,
  users: seedUsers,
  currentUserId: "user-1",
  matches: seedMatches,
  bets: seedBets,
  withdrawals: seedWithdrawals,
  notifications: seedNotifications,
};

const AppStoreContext = createContext<StoreShape | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [currentUserId, setCurrentUserId] = useState<string | null>("user-1");
  const [matches, setMatches] = useState<Match[]>(seedMatches);
  const [bets, setBets] = useState<Bet[]>(seedBets);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(seedWithdrawals);
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("wt-bet-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<typeof defaultState>;
        setUsers(parsed.users?.length ? (parsed.users as User[]) : seedUsers);
        setCurrentUserId(
          typeof parsed.currentUserId === "string" ? parsed.currentUserId : "user-1",
        );
        setMatches(parsed.matches?.length ? (parsed.matches as Match[]) : seedMatches);
        setBets(parsed.bets?.length ? (parsed.bets as Bet[]) : seedBets);
        setWithdrawals(
          parsed.withdrawals?.length ? (parsed.withdrawals as Withdrawal[]) : seedWithdrawals,
        );
        setNotifications(
          parsed.notifications?.length
            ? (parsed.notifications as Notification[])
            : seedNotifications,
        );
      } catch {
        // Keep defaults if saved state is invalid.
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("wt-bet-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [hydrated, theme]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ users, currentUserId, matches, bets, withdrawals, notifications }),
    );
  }, [hydrated, users, currentUserId, matches, bets, withdrawals, notifications]);

  const currentUser = users.find((user) => user.id === currentUserId) ?? null;

  const value = useMemo<StoreShape>(
    () => ({
      hydrated,
      theme,
      setTheme,
      users,
      currentUserId,
      currentUser,
      matches,
      bets,
      withdrawals,
      notifications,
      signUp: ({ name, email, password }) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (users.some((user) => user.email === normalizedEmail)) {
          throw new Error("An account already exists for this email.");
        }
        const nextUser: User = {
          id: createId("user"),
          name,
          email: normalizedEmail,
          password,
          role: "user",
          balance: 1000,
          kycStatus: "unverified",
          createdAt: new Date().toISOString(),
        };
        setUsers((current) => [nextUser, ...current]);
        setCurrentUserId(nextUser.id);
        setNotifications((current) => [
          {
            id: createId("notification"),
            title: "Account created",
            message: `${name} joined W&T Bet.`,
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);
        return nextUser.id;
      },
      signIn: ({ email, password }) => {
        const found = users.find(
          (user) => user.email === email.trim().toLowerCase() && user.password === password,
        );
        if (!found) {
          throw new Error("Invalid email or password.");
        }
        setCurrentUserId(found.id);
        return found.id;
      },
      signOut: () => setCurrentUserId(null),
      placeBet: ({ matchId, selection, stake }) => {
        if (!currentUser) throw new Error("Sign in first.");
        if (stake <= 0) throw new Error("Stake must be greater than zero.");
        if (currentUser.balance < stake) throw new Error("Insufficient balance.");

        const match = matches.find((item) => item.id === matchId);
        if (!match) throw new Error("Match not found.");

        const odds =
          selection === "home"
            ? match.homeOdds
            : selection === "draw"
              ? match.drawOdds
              : match.awayOdds;
        const pick = selection === "home" ? match.home : selection === "draw" ? "Draw" : match.away;

        const bet: Bet = {
          id: createId("bet"),
          userId: currentUser.id,
          matchId,
          kind: "single",
          selection,
          pick,
          stake,
          odds,
          potentialPayout: Number((stake * odds).toFixed(2)),
          status: "open",
          placedAt: new Date().toISOString(),
          legs: [{ matchId, selection, pick, odds }],
        };

        setUsers((current) =>
          current.map((user) =>
            user.id === currentUser.id
              ? { ...user, balance: Number((user.balance - stake).toFixed(2)) }
              : user,
          ),
        );
        setBets((current) => [bet, ...current]);
        setNotifications((current) => [
          {
            id: createId("notification"),
            title: "Bet placed",
            message: `${pick} on ${match.home} vs ${match.away}`,
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);
        return bet.id;
      },
      placeAccumulatorBet: ({ selections, stake }) => {
        if (!currentUser) throw new Error("Sign in first.");
        if (stake <= 0) throw new Error("Stake must be greater than zero.");
        if (selections.length === 0) throw new Error("Add at least one selection.");
        if (currentUser.balance < stake) throw new Error("Insufficient balance.");

        const legs = selections
          .map((item) => {
            const match = matches.find((entry) => entry.id === item.matchId);
            if (!match) return null;
            const odds =
              item.selection === "home"
                ? match.homeOdds
                : item.selection === "draw"
                  ? match.drawOdds
                  : match.awayOdds;
            const pick =
              item.selection === "home"
                ? match.home
                : item.selection === "draw"
                  ? "Draw"
                  : match.away;
            return { matchId: match.id, selection: item.selection, pick, odds };
          })
          .filter(Boolean) as NonNullable<Bet["legs"]>[number][];

        if (legs.length === 0) throw new Error("No valid selections found.");

        const totalOdds = legs.reduce((acc, leg) => acc * leg.odds, 1);
        const bet: Bet = {
          id: createId("bet"),
          userId: currentUser.id,
          matchId: legs.map((leg) => leg.matchId).join(","),
          kind: "accumulator",
          selection: legs[0].selection,
          pick: legs.map((leg) => leg.pick).join(" + "),
          stake,
          odds: Number(totalOdds.toFixed(2)),
          potentialPayout: Number((stake * totalOdds).toFixed(2)),
          status: "open",
          placedAt: new Date().toISOString(),
          legs,
        };

        setUsers((current) =>
          current.map((user) =>
            user.id === currentUser.id
              ? { ...user, balance: Number((user.balance - stake).toFixed(2)) }
              : user,
          ),
        );
        setBets((current) => [bet, ...current]);
        setNotifications((current) => [
          {
            id: createId("notification"),
            title: "Accumulator placed",
            message: `${legs.length} legs added to your slip.`,
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);
        return bet.id;
      },
      requestWithdrawal: (amount) => {
        if (!currentUser) throw new Error("Sign in first.");
        if (amount <= 0) throw new Error("Withdrawal amount must be greater than zero.");
        if (currentUser.balance < amount) throw new Error("Insufficient balance.");
        const fee = Number((amount * 0.1).toFixed(2));
        const netAmount = Number((amount - fee).toFixed(2));
        const withdrawal: Withdrawal = {
          id: createId("withdrawal"),
          userId: currentUser.id,
          amount,
          serviceFee: fee,
          netAmount,
          status: "requested",
          createdAt: new Date().toISOString(),
        };
        setWithdrawals((current) => [withdrawal, ...current]);
        setNotifications((current) => [
          {
            id: createId("notification"),
            title: "Withdrawal requested",
            message: `Review ${amount.toFixed(2)} withdrawal for ${currentUser.name}.`,
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);
        return withdrawal.id;
      },
      verifyKyc: () => {
        if (!currentUser) throw new Error("Sign in first.");
        setUsers((current) =>
          current.map((user) =>
            user.id === currentUser.id ? { ...user, kycStatus: "pending" } : user,
          ),
        );
      },
      createLocalMatch: (input) => {
        const match: Match = {
          id: createId("match"),
          status: input.status ?? "upcoming",
          ...input,
        };
        setMatches((current) => [match, ...current]);
        return match.id;
      },
      updateMatch: (id, patch) => {
        setMatches((current) =>
          current.map((match) => (match.id === id ? { ...match, ...patch } : match)),
        );
      },
      settleMatch: ({ matchId, result }) => {
        const match = matches.find((item) => item.id === matchId);
        if (!match) throw new Error("Match not found.");

        const nextMatches = matches.map((item) =>
          item.id === matchId
            ? { ...item, status: "settled" as const, live: false, settledResult: result }
            : item,
        );
        setMatches(nextMatches);

        setBets((current) =>
          current.map((bet) => {
            if (bet.status !== "open") return bet;
            const legForMatch = bet.legs.find((leg) => leg.matchId === matchId);
            if (!legForMatch) return bet;

            if (bet.kind === "single") {
              const won = legForMatch.selection === result;
              if (won) {
                setUsers((usersCurrent) =>
                  usersCurrent.map((user) =>
                    user.id === bet.userId
                      ? {
                          ...user,
                          balance: Number((user.balance + bet.potentialPayout).toFixed(2)),
                        }
                      : user,
                  ),
                );
              }
              return { ...bet, status: won ? "won" : "lost" };
            }

            const evaluatedLegs = bet.legs.map((leg) => {
              const settledMatch = nextMatches.find((item) => item.id === leg.matchId);
              return {
                ...leg,
                outcome: settledMatch?.settledResult,
              };
            });

            const anyLost = evaluatedLegs.some(
              (leg) => leg.outcome != null && leg.outcome !== leg.selection,
            );
            const allSettled = evaluatedLegs.every((leg) => leg.outcome != null);

            if (anyLost) {
              return { ...bet, status: "lost" };
            }

            if (allSettled) {
              setUsers((usersCurrent) =>
                usersCurrent.map((user) =>
                  user.id === bet.userId
                    ? { ...user, balance: Number((user.balance + bet.potentialPayout).toFixed(2)) }
                    : user,
                ),
              );
              return { ...bet, status: "won" };
            }

            return bet;
          }),
        );

        setNotifications((current) => [
          {
            id: createId("notification"),
            title: "Match settled",
            message: `${match.home} vs ${match.away} is now settled.`,
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);
      },
      approveWithdrawal: (id) => {
        setWithdrawals((current) =>
          current.map((withdrawal) =>
            withdrawal.id === id ? { ...withdrawal, status: "approved" } : withdrawal,
          ),
        );
      },
      rejectWithdrawal: (id) => {
        setWithdrawals((current) =>
          current.map((withdrawal) =>
            withdrawal.id === id ? { ...withdrawal, status: "rejected" } : withdrawal,
          ),
        );
      },
    }),
    [
      bets,
      currentUser,
      currentUserId,
      hydrated,
      matches,
      notifications,
      setTheme,
      theme,
      users,
      withdrawals,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }
  return context;
}
