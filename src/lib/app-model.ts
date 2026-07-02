export type Role = "user" | "admin";
export type KycStatus = "unverified" | "pending" | "verified";
export type MatchStatus = "upcoming" | "live" | "settled";
export type BetStatus = "open" | "won" | "lost";
export type WithdrawalStatus = "requested" | "approved" | "rejected";

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
    createdAt: new Date().toISOString(),
  };

  const demoUser: User = {
    id: "user-1",
    name: "Demo Bettor",
    email: "player@wtbet.local",
    password: "player123",
    role: "user",
    balance: 1248.5,
    kycStatus: "pending",
    kycSubmission: {
      fullName: "Demo Bettor",
      country: "Barbados",
      address: "123 Demo Street, Bridgetown",
      documentType: "National ID",
      documentNumber: "DB-1001",
      submittedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
  };

  return {
    users: [adminUser, demoUser],
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
    ],
    bets: [],
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
