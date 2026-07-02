export type Role = "user" | "admin";
export type KycStatus = "unverified" | "pending" | "verified";
export type MatchStatus = "upcoming" | "live" | "settled";
export type BetStatus = "open" | "won" | "lost";
export type WithdrawalStatus = "requested" | "approved" | "rejected";
export type DepositStatus = "requested" | "approved" | "rejected";
export type BetMarketType = "match-result" | "correct-score" | "over-under";

export type KycSubmission = {
  fullName: string;
  country: string;
  address: string;
  documentType: string;
  documentNumber: string;
  notes?: string;
  submittedAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  balance: number;
  kycStatus: KycStatus;
  kycSubmission?: KycSubmission;
  kycReviewedAt?: string;
  watchlistMatchIds?: string[];
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
  source?: "local" | "football-data";
  correctScoreOdds?: Record<string, number>;
  overUnderOdds?: Record<number, { over: number; under: number }>;
  simulation?: {
    status: "scheduled" | "running" | "settled";
    startedAt: string;
    durationMinutes: number;
    seed: number;
  };
  settledResult?: "home" | "draw" | "away";
};

export type Bet = {
  id: string;
  userId: string;
  matchId: string;
  kind: "single" | "accumulator";
  marketType: BetMarketType;
  selection: string;
  pick: string;
  stake: number;
  odds: number;
  potentialPayout: number;
  status: BetStatus;
  placedAt: string;
  legs: Array<{
    matchId: string;
    marketType: BetMarketType;
    selection: string;
    pick: string;
    odds: number;
    line?: number;
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

export type Deposit = {
  id: string;
  userId: string;
  amount: number;
  status: DepositStatus;
  createdAt: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

export type AppState = {
  users: User[];
  matches: Match[];
  bets: Bet[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  notifications: Notification[];
};

export type AppSnapshot = AppState & {
  currentUserId: string | null;
};

export type AppStateBootstrap = {
  state: AppState;
  currentUserId: string | null;
};

export type FootballFeedItem = {
  id: string;
  league: string;
  home: string;
  away: string;
  status: string;
  minute: string;
  score: string;
  kickoff?: string;
  source: "football-data" | "local";
};

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createInitialState(): AppState {
  const adminUser: User = {
    id: "admin-1",
    name: "W&T Admin",
    email: "admin@wtbet.local",
    password: "admin123",
    role: "admin",
    balance: 100000,
    kycStatus: "verified",
    kycSubmission: undefined,
    kycReviewedAt: new Date().toISOString(),
    watchlistMatchIds: ["match-1"],
    createdAt: new Date().toISOString(),
  };

  return {
    users: [adminUser],
    matches: [
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
        correctScoreOdds: {
          "0-0": 13,
          "1-0": 7.5,
          "0-1": 9.8,
          "1-1": 6.6,
          "2-0": 9.5,
          "0-2": 15,
          "2-1": 8.9,
          "1-2": 13.5,
        },
        overUnderOdds: {
          2.5: { over: 1.82, under: 1.98 },
          3.5: { over: 2.6, under: 1.45 },
        },
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
        correctScoreOdds: {
          "0-0": 12,
          "1-0": 8.1,
          "0-1": 8.8,
          "1-1": 6.2,
          "2-0": 10.4,
          "0-2": 11.2,
          "2-1": 8.2,
          "1-2": 10.7,
        },
        overUnderOdds: {
          2.5: { over: 1.95, under: 1.85 },
          3.5: { over: 2.95, under: 1.36 },
        },
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
        correctScoreOdds: {
          "0-0": 10,
          "1-0": 11,
          "0-1": 5.8,
          "1-1": 9.4,
          "2-0": 15,
          "0-2": 4.2,
          "2-1": 18,
          "1-2": 4.8,
        },
        overUnderOdds: {
          2.5: { over: 2.15, under: 1.69 },
        },
        featured: false,
        live: false,
      },
    ],
    bets: [],
    deposits: [],
    withdrawals: [],
    notifications: [
      {
        id: "n-1",
        title: "Welcome to W&T Bet",
        message: "Sign in, verify your account, and start placing bets.",
        createdAt: new Date().toISOString(),
      },
    ],
  };
}
