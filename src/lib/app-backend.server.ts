import { createServerFn } from "@tanstack/react-start";
import { clearSession, getSession, updateSession } from "@tanstack/react-start/server";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { randomBytes, pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  createId,
  createInitialState,
  type AppState,
  type AppStateBootstrap,
  type Bet,
  type FootballFeedItem,
  type Deposit,
  type KycSubmission,
  type Match,
  type Notification,
  type User,
  type Withdrawal,
} from "./app-model";
import { getFirebaseFirestore } from "./firebase";
import {
  getCorrectScoreOdds,
  getOverUnderOdds,
  getMarketPickLabel,
  parseScore,
} from "./market-utils";

const STATE_DOC = ["app", "wt-bet-state"] as const;
const SESSION_CONFIG = {
  password: process.env.AUTH_SECRET ?? "wt-bet-dev-secret",
  name: "wt-bet-session",
  cookie: {
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  },
};

let memoryState: AppState | null = null;

type SessionSnapshot = AppStateBootstrap;

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeUsers(users: User[]) {
  return users.map((user) =>
    user.password.includes(":")
      ? user
      : {
          ...user,
          password: hashPassword(user.password),
        },
  );
}

function normalizeState(state: AppState): AppState {
  return {
    ...state,
    users: normalizeUsers(state.users),
  };
}

async function readState(): Promise<AppState> {
  const firestore = getFirebaseFirestore();

  if (firestore) {
    const stateRef = doc(firestore, STATE_DOC[0], STATE_DOC[1]);
    const snapshot = await getDoc(stateRef);
    if (snapshot.exists()) {
      return normalizeState(snapshot.data() as AppState);
    }

    const seed = normalizeState(createInitialState());
    await setDoc(stateRef, seed);
    return seed;
  }

  if (!memoryState) {
    memoryState = normalizeState(createInitialState());
  }

  return cloneState(memoryState);
}

async function writeState(state: AppState) {
  const next = normalizeState(state);
  const firestore = getFirebaseFirestore();

  if (firestore) {
    const stateRef = doc(firestore, STATE_DOC[0], STATE_DOC[1]);
    await setDoc(stateRef, next);
    return;
  }

  memoryState = cloneState(next);
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const candidate = pbkdf2Sync(password, salt, 120000, 32, "sha256");
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function getCurrentUser(state: AppState, currentUserId: string | null) {
  return currentUserId ? (state.users.find((user) => user.id === currentUserId) ?? null) : null;
}

function appendNotification(state: AppState, notification: Notification) {
  state.notifications = [notification, ...state.notifications];
}

function resolveMarketOutcome(
  match: Match,
  leg: Bet["legs"][number],
): boolean | null {
  const score = parseScore(match.score);
  if (!score && match.status !== "settled") {
    return null;
  }

  const finalHome = score?.home ?? 0;
  const finalAway = score?.away ?? 0;
  const totalGoals = finalHome + finalAway;

  if (leg.marketType === "match-result") {
    if (!match.settledResult && match.status !== "settled") return null;
    const result =
      match.settledResult ??
      (finalHome > finalAway ? "home" : finalHome < finalAway ? "away" : "draw");
    return leg.selection === result;
  }

  if (leg.marketType === "correct-score") {
    return leg.selection === `${finalHome}-${finalAway}`;
  }

  if (leg.marketType === "over-under") {
    const line = leg.line ?? 2.5;
    if (leg.selection === "over") return totalGoals > line;
    if (leg.selection === "under") return totalGoals < line;
    return null;
  }

  return null;
}

function createSimulationSeed() {
  return randomBytes(4).readUInt32BE(0);
}

function getSimulatedScore(seed: number, phase: "scheduled" | "running" | "settled") {
  if (phase === "scheduled") {
    return { minute: "Kickoff soon", score: "0-0" };
  }

  if (phase === "running") {
    const bucket = seed % 3;
    if (bucket === 0) return { minute: "38'", score: "1-0" };
    if (bucket === 1) return { minute: "54'", score: "1-1" };
    return { minute: "63'", score: "0-1" };
  }

  const bucket = seed % 3;
  if (bucket === 0) return { minute: "FT", score: "2-1", result: "home" as const };
  if (bucket === 1) return { minute: "FT", score: "1-1", result: "draw" as const };
  return { minute: "FT", score: "1-2", result: "away" as const };
}

function advanceLocalSimulation(state: AppState) {
  const now = Date.now();
  let changed = false;
  const settledMatches: Array<{ matchId: string; result: "home" | "draw" | "away" }> = [];

  const matches = state.matches.map((match) => {
    if (match.source !== "local" || !match.simulation) return match;

    const startedAt = new Date(match.simulation.startedAt).getTime();
    const duration = match.simulation.durationMinutes * 60_000;
    const elapsed = now - startedAt;

    if (elapsed < 120_000) {
      const nextMatch = {
        ...match,
        status: "upcoming" as const,
        live: false,
        minute: "Kickoff soon",
        score: "0-0",
        simulation: { ...match.simulation, status: "scheduled" as const },
      };
      if (
        nextMatch.status !== match.status ||
        nextMatch.live !== match.live ||
        nextMatch.minute !== match.minute ||
        nextMatch.score !== match.score ||
        nextMatch.simulation.status !== match.simulation.status
      ) {
        changed = true;
      }
      return nextMatch;
    }

    if (elapsed < duration) {
      const bucket = match.simulation.seed % 3;
      const liveMinute = `${Math.max(1, Math.floor((elapsed / duration) * 90))}'`;
      const score =
        bucket === 0 ? "1-0" : bucket === 1 ? "1-1" : elapsed > duration * 0.55 ? "0-1" : "0-0";
      const nextMatch = {
        ...match,
        status: "live" as const,
        live: true,
        minute: liveMinute,
        score,
        simulation: { ...match.simulation, status: "running" as const },
      };
      if (
        nextMatch.status !== match.status ||
        nextMatch.live !== match.live ||
        nextMatch.minute !== match.minute ||
        nextMatch.score !== match.score ||
        nextMatch.simulation.status !== match.simulation.status
      ) {
        changed = true;
      }
      return nextMatch;
    }

    const outcome = getSimulatedScore(match.simulation.seed, "settled");
    const nextMatch = {
      ...match,
      status: "settled" as const,
      live: false,
      minute: outcome.minute,
      score: outcome.score,
      settledResult: outcome.result,
      simulation: { ...match.simulation, status: "settled" as const },
    };
    changed = true;
    settledMatches.push({ matchId: match.id, result: outcome.result });
    return nextMatch;
  });

  if (!changed && settledMatches.length === 0) {
    return state;
  }

  const nextState: AppState = {
    ...state,
    matches,
  };

  for (const settled of settledMatches) {
    settleBets(nextState, settled.matchId, settled.result);
    appendNotification(nextState, {
      id: createId("notification"),
      title: "Simulation settled",
      message: `${nextState.matches.find((item) => item.id === settled.matchId)?.home} vs ${
        nextState.matches.find((item) => item.id === settled.matchId)?.away
      } has finished.`,
      createdAt: new Date().toISOString(),
    });
  }

  return nextState;
}

function normalizeFootballDataItem(raw: unknown, fallbackIndex: number): FootballFeedItem {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const competition =
    data.competition && typeof data.competition === "object"
      ? (data.competition as Record<string, unknown>)
      : {};
  const homeTeam =
    data.homeTeam && typeof data.homeTeam === "object"
      ? (data.homeTeam as Record<string, unknown>)
      : {};
  const awayTeam =
    data.awayTeam && typeof data.awayTeam === "object"
      ? (data.awayTeam as Record<string, unknown>)
      : {};
  const score =
    data.score && typeof data.score === "object" ? (data.score as Record<string, unknown>) : {};
  const fullTime =
    score.fullTime && typeof score.fullTime === "object"
      ? (score.fullTime as Record<string, unknown>)
      : {};
  const current =
    score.current && typeof score.current === "object"
      ? (score.current as Record<string, unknown>)
      : {};
  const utcDate = typeof data.utcDate === "string" ? data.utcDate : undefined;
  const statusValue = typeof data.status === "string" ? data.status : "SCHEDULED";
  const home =
    (homeTeam.shortName as string | undefined) ??
    (homeTeam.name as string | undefined) ??
    `Home ${fallbackIndex + 1}`;
  const away =
    (awayTeam.shortName as string | undefined) ??
    (awayTeam.name as string | undefined) ??
    `Away ${fallbackIndex + 1}`;
  const league =
    (competition.name as string | undefined) ??
    (competition.code as string | undefined) ??
    "Football";
  const scoreValue =
    typeof current.home === "number" || typeof current.away === "number"
      ? `${current.home ?? fullTime.home ?? 0}-${current.away ?? fullTime.away ?? 0}`
      : `${fullTime.home ?? 0}-${fullTime.away ?? 0}`;
  const minute =
    statusValue === "LIVE" || statusValue === "IN_PLAY" || statusValue === "PAUSED"
      ? "Live"
      : statusValue === "FINISHED"
        ? "FT"
        : utcDate
          ? new Date(utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Scheduled";

  return {
    id: String(data.id ?? fallbackIndex + 1),
    league,
    home,
    away,
    status: statusValue,
    minute,
    score: scoreValue,
    kickoff: utcDate,
    source: "football-data",
  };
}

function settleBets(state: AppState, matchId: string, _result: "home" | "draw" | "away") {
  state.bets = state.bets.map((bet) => {
    if (bet.status !== "open") return bet;

    const legForMatch = bet.legs.find((leg) => leg.matchId === matchId);
    if (!legForMatch) return bet;

    if (bet.kind === "single") {
      const marketOutcome =
        legForMatch.marketType === "match-result"
          ? legForMatch.selection === result
          : resolveMarketOutcome(
              state.matches.find((item) => item.id === matchId) ?? {
                id: matchId,
                league: "",
                home: "",
                away: "",
                status: "settled",
                minute: "FT",
                score: "0-0",
                homeOdds: 1,
                drawOdds: 1,
                awayOdds: 1,
                featured: false,
                live: false,
              },
              legForMatch,
            ) ?? false;
      const won = marketOutcome;
      if (won) {
        state.users = state.users.map((user) =>
          user.id === bet.userId
            ? { ...user, balance: Number((user.balance + bet.potentialPayout).toFixed(2)) }
            : user,
        );
      }
      return { ...bet, status: won ? "won" : "lost" };
    }

    const evaluatedLegs = bet.legs.map((leg) => {
      const settledMatch = state.matches.find((item) => item.id === leg.matchId);
      return {
        ...leg,
        outcome: settledMatch ? resolveMarketOutcome(settledMatch, leg) : null,
      };
    });

    const anyLost = evaluatedLegs.some((leg) => leg.outcome === false);
    const allSettled = evaluatedLegs.every((leg) => leg.outcome != null);

    if (anyLost) {
      return { ...bet, status: "lost" };
    }

    if (allSettled) {
      state.users = state.users.map((user) =>
        user.id === bet.userId
          ? { ...user, balance: Number((user.balance + bet.potentialPayout).toFixed(2)) }
          : user,
      );
      return { ...bet, status: "won" };
    }

    return bet;
  });
}

async function getBootstrapState(): Promise<SessionSnapshot> {
  const initialState = await readState();
  const state = advanceLocalSimulation(initialState);
  if (state !== initialState) {
    await writeState(state);
  }
  const session = await getSession(SESSION_CONFIG);
  const currentUserId = session.data.userId ?? null;
  return { ...state, currentUserId };
}

export const fetchBootstrapState = createServerFn({ method: "GET" }).handler(async () => {
  return getBootstrapState();
});

export const fetchFootballFeedAction = createServerFn({ method: "GET" }).handler(async () => {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  const state = await readState();

  if (!token) {
    return {
      provider: "fallback" as const,
      items: state.matches
        .filter((match) => match.sport.toLowerCase() === "football")
        .slice(0, 6)
        .map((match) => ({
          id: match.id,
          league: match.league,
          home: match.home,
          away: match.away,
          status:
            match.status === "settled"
              ? "Finished"
              : match.status === "live"
                ? "Live"
                : "Scheduled",
          minute: match.minute,
          score: match.score,
          kickoff: undefined,
          source: "local" as const,
        })),
      updatedAt: new Date().toISOString(),
      note: "Set FOOTBALL_DATA_API_TOKEN to show free real football data from football-data.org.",
    };
  }

  const url = new URL("https://api.football-data.org/v4/matches");
  const today = new Date();
  const from = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const to = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  url.searchParams.set("dateFrom", from);
  url.searchParams.set("dateTo", to);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Auth-Token": token,
    },
  });

  if (!response.ok) {
    const fallback = state.matches
      .filter((match) => match.sport.toLowerCase() === "football")
      .slice(0, 6)
      .map((match) => ({
        id: match.id,
        league: match.league,
        home: match.home,
        away: match.away,
        status:
          match.status === "settled" ? "Finished" : match.status === "live" ? "Live" : "Scheduled",
        minute: match.minute,
        score: match.score,
        kickoff: undefined,
        source: "local" as const,
      }));

    return {
      provider: "fallback" as const,
      items: fallback,
      updatedAt: new Date().toISOString(),
      note: "football-data.org is unavailable right now, so the app is showing local football data.",
    };
  }

  const payload = (await response.json()) as { matches?: unknown[] };
  const items = (payload.matches ?? [])
    .slice(0, 8)
    .map((item, index) => normalizeFootballDataItem(item, index));

  return {
    provider: "football-data" as const,
    items,
    updatedAt: new Date().toISOString(),
  };
});

export const signUpAction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
    }),
  )
  .handler(async ({ data }) => {
    const state = await readState();
    const normalizedEmail = data.email.trim().toLowerCase();

    if (state.users.some((user) => user.email === normalizedEmail)) {
      throw new Error("An account already exists for this email.");
    }

    const nextUser: User = {
      id: createId("user"),
      name: data.name.trim(),
      email: normalizedEmail,
      password: hashPassword(data.password),
      role: "user",
      balance: 1000,
      kycStatus: "unverified",
      kycSubmission: undefined,
      watchlistMatchIds: [],
      createdAt: new Date().toISOString(),
    };

    const nextState: AppState = {
      ...state,
      users: [nextUser, ...state.users],
      notifications: [
        {
          id: createId("notification"),
          title: "Account created",
          message: `${nextUser.name} joined W&T Bet.`,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    };

    await writeState(nextState);
    await updateSession(SESSION_CONFIG, { userId: nextUser.id });
    return { userId: nextUser.id };
  });

export const signInAction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const state = await readState();
    const normalizedEmail = data.email.trim().toLowerCase();
    const user = state.users.find((item) => item.email === normalizedEmail);

    if (!user || !verifyPassword(data.password, user.password)) {
      throw new Error("Invalid email or password.");
    }

    await updateSession(SESSION_CONFIG, { userId: user.id });
    return { userId: user.id };
  });

export const signOutAction = createServerFn({ method: "POST" }).handler(async () => {
  await clearSession(SESSION_CONFIG);
  return { ok: true };
});

export const placeBetAction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      matchId: z.string().min(1),
      marketType: z.enum(["match-result", "correct-score", "over-under"]).optional(),
      selection: z.string().min(1),
      line: z.number().positive().optional(),
      stake: z.number().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const state = await readState();
    const session = await getSession(SESSION_CONFIG);
    const currentUser = getCurrentUser(state, session.data.userId ?? null);

    if (!currentUser) throw new Error("Sign in first.");
    if (currentUser.balance < data.stake) throw new Error("Insufficient balance.");

    const match = state.matches.find((item) => item.id === data.matchId);
    if (!match) throw new Error("Match not found.");

    const marketType = data.marketType ?? "match-result";
    const market = getMarketPickLabel(match, {
      marketType,
      selection: data.selection,
      line: data.line,
    });

    const bet: Bet = {
      id: createId("bet"),
      userId: currentUser.id,
      matchId: data.matchId,
      kind: "single",
      marketType,
      selection: data.selection,
      pick: market.pick,
      stake: data.stake,
      odds: market.odds,
      potentialPayout: Number((data.stake * market.odds).toFixed(2)),
      status: "open",
      placedAt: new Date().toISOString(),
      legs: [
        {
          matchId: data.matchId,
          marketType,
          selection: data.selection,
          pick: market.pick,
          odds: market.odds,
          line: data.line,
        },
      ],
    };

    const nextState: AppState = {
      ...state,
      users: state.users.map((user) =>
        user.id === currentUser.id
          ? { ...user, balance: Number((user.balance - data.stake).toFixed(2)) }
          : user,
      ),
      bets: [bet, ...state.bets],
      notifications: [
        {
          id: createId("notification"),
          title: "Bet placed",
          message: `${market.label}: ${market.pick} on ${match.home} vs ${match.away}`,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    };

    await writeState(nextState);
    return { betId: bet.id };
  });

export const placeAccumulatorBetAction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      selections: z
        .array(
          z.object({
            matchId: z.string().min(1),
            marketType: z.enum(["match-result", "correct-score", "over-under"]),
            selection: z.string().min(1),
            line: z.number().positive().optional(),
          }),
        )
        .min(1),
      stake: z.number().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const state = await readState();
    const session = await getSession(SESSION_CONFIG);
    const currentUser = getCurrentUser(state, session.data.userId ?? null);

    if (!currentUser) throw new Error("Sign in first.");
    if (currentUser.balance < data.stake) throw new Error("Insufficient balance.");

    const legs = data.selections
      .map((item) => {
        const match = state.matches.find((entry) => entry.id === item.matchId);
        if (!match) return null;
        const market = getMarketPickLabel(match, {
          marketType: item.marketType,
          selection: item.selection,
          line: item.line,
        });
        return {
          matchId: match.id,
          marketType: item.marketType,
          selection: item.selection,
          pick: market.pick,
          odds: market.odds,
          line: item.line,
        };
      })
      .filter(Boolean) as NonNullable<Bet["legs"]>[number][];

    if (legs.length === 0) throw new Error("No valid selections found.");

    const totalOdds = legs.reduce((acc, leg) => acc * leg.odds, 1);
    const bet: Bet = {
      id: createId("bet"),
      userId: currentUser.id,
      matchId: legs.map((leg) => leg.matchId).join(","),
      kind: "accumulator",
      marketType: legs[0].marketType,
      selection: legs[0].selection,
      pick: legs.map((leg) => leg.pick).join(" + "),
      stake: data.stake,
      odds: Number(totalOdds.toFixed(2)),
      potentialPayout: Number((data.stake * totalOdds).toFixed(2)),
      status: "open",
      placedAt: new Date().toISOString(),
      legs,
    };

    const nextState: AppState = {
      ...state,
      users: state.users.map((user) =>
        user.id === currentUser.id
          ? { ...user, balance: Number((user.balance - data.stake).toFixed(2)) }
          : user,
      ),
      bets: [bet, ...state.bets],
      notifications: [
        {
          id: createId("notification"),
          title: "Accumulator placed",
          message: `${legs.length} legs added to your slip.`,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    };

    await writeState(nextState);
    return { betId: bet.id };
  });

export const requestDepositAction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      amount: z.number().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const state = await readState();
    const session = await getSession(SESSION_CONFIG);
    const currentUser = getCurrentUser(state, session.data.userId ?? null);

    if (!currentUser) throw new Error("Sign in first.");

    const deposit: Deposit = {
      id: createId("deposit"),
      userId: currentUser.id,
      amount: data.amount,
      status: "requested",
      createdAt: new Date().toISOString(),
    };

    const nextState: AppState = {
      ...state,
      deposits: [deposit, ...state.deposits],
      notifications: [
        {
          id: createId("notification"),
          title: "Deposit requested",
          message: `${currentUser.name} requested a ${data.amount.toFixed(2)} wallet top-up.`,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    };

    await writeState(nextState);
    return { depositId: deposit.id };
  });

export const requestWithdrawalAction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      amount: z.number().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const state = await readState();
    const session = await getSession(SESSION_CONFIG);
    const currentUser = getCurrentUser(state, session.data.userId ?? null);

    if (!currentUser) throw new Error("Sign in first.");
    if (currentUser.kycStatus !== "verified") {
      throw new Error("Complete verification before requesting a withdrawal.");
    }
    if (currentUser.balance < data.amount) throw new Error("Insufficient balance.");

    const fee = Number((data.amount * 0.1).toFixed(2));
    const netAmount = Number((data.amount - fee).toFixed(2));
    const withdrawal: Withdrawal = {
      id: createId("withdrawal"),
      userId: currentUser.id,
      amount: data.amount,
      serviceFee: fee,
      netAmount,
      status: "requested",
      createdAt: new Date().toISOString(),
    };

    const nextState: AppState = {
      ...state,
      withdrawals: [withdrawal, ...state.withdrawals],
      notifications: [
        {
          id: createId("notification"),
          title: "Withdrawal requested",
          message: `Review ${data.amount.toFixed(2)} withdrawal for ${currentUser.name}.`,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    };

    await writeState(nextState);
    return { withdrawalId: withdrawal.id };
  });

export const verifyKycAction = createServerFn({ method: "POST" }).handler(async () => {
  const state = await readState();
  const session = await getSession(SESSION_CONFIG);
  const currentUser = getCurrentUser(state, session.data.userId ?? null);

  if (!currentUser) throw new Error("Sign in first.");

  const nextState: AppState = {
    ...state,
    users: state.users.map((user) =>
      user.id === currentUser.id
        ? {
            ...user,
            kycStatus: "pending",
            kycSubmission: user.kycSubmission ?? {
              fullName: user.name,
              country: "Unknown",
              address: "Not provided",
              documentType: "Manual review",
              documentNumber: user.id,
              submittedAt: new Date().toISOString(),
            },
          }
        : user,
    ),
    notifications: [
      {
        id: createId("notification"),
        title: "KYC submitted",
        message: "Your documents are waiting for review.",
        createdAt: new Date().toISOString(),
      },
      ...state.notifications,
    ],
  };

  await writeState(nextState);
  return { ok: true };
});

export const toggleWatchlistMatchAction = createServerFn({ method: "POST" })
  .validator(z.object({ matchId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const state = await readState();
    const session = await getSession(SESSION_CONFIG);
    const currentUser = getCurrentUser(state, session.data.userId ?? null);

    if (!currentUser) throw new Error("Sign in first.");

    const currentWatchlist = currentUser.watchlistMatchIds ?? [];
    const isWatching = currentWatchlist.includes(data.matchId);
    const nextWatchlist = isWatching
      ? currentWatchlist.filter((id) => id !== data.matchId)
      : [data.matchId, ...currentWatchlist];

    const nextState: AppState = {
      ...state,
      users: state.users.map((user) =>
        user.id === currentUser.id
          ? { ...user, watchlistMatchIds: nextWatchlist }
          : user,
      ),
      notifications: [
        {
          id: createId("notification"),
          title: isWatching ? "Alert removed" : "Alert added",
          message: isWatching
            ? "A match was removed from your watchlist."
            : "A match was added to your watchlist.",
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    };

    await writeState(nextState);
    return { ok: true, watching: !isWatching };
  });

export const submitKycAction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      fullName: z.string().min(1),
      country: z.string().min(1),
      address: z.string().min(1),
      documentType: z.string().min(1),
      documentNumber: z.string().min(1),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const state = await readState();
    const session = await getSession(SESSION_CONFIG);
    const currentUser = getCurrentUser(state, session.data.userId ?? null);

    if (!currentUser) throw new Error("Sign in first.");

    const submission: KycSubmission = {
      fullName: data.fullName.trim(),
      country: data.country.trim(),
      address: data.address.trim(),
      documentType: data.documentType.trim(),
      documentNumber: data.documentNumber.trim(),
      notes: data.notes?.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };

    const nextState: AppState = {
      ...state,
      users: state.users.map((user) =>
        user.id === currentUser.id
          ? { ...user, kycStatus: "pending", kycSubmission: submission }
          : user,
      ),
      notifications: [
        {
          id: createId("notification"),
          title: "KYC submitted",
          message: `${currentUser.name} submitted identity details for review.`,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    };

    await writeState(nextState);
    return { ok: true };
  });

export const createLocalMatchAction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      sport: z.string().min(1),
      league: z.string().min(1),
      home: z.string().min(1),
      away: z.string().min(1),
      minute: z.string().min(1),
      score: z.string().min(1),
      homeOdds: z.number().positive(),
      drawOdds: z.number().positive(),
      awayOdds: z.number().positive(),
      featured: z.boolean(),
      live: z.boolean(),
      status: z.enum(["upcoming", "live", "settled"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const state = await readState();
    const baseMatch: Match = {
      id: createId("match"),
      status: data.status ?? "upcoming",
      sport: data.sport,
      league: data.league,
      home: data.home,
      away: data.away,
      minute: data.minute,
      score: data.score,
      homeOdds: data.homeOdds,
      drawOdds: data.drawOdds,
      awayOdds: data.awayOdds,
      featured: data.featured,
      live: data.live,
      source: "local",
      simulation: {
        status: "scheduled",
        startedAt: new Date().toISOString(),
        durationMinutes: 12,
        seed: createSimulationSeed(),
      },
    };

    const match: Match = {
      ...baseMatch,
      correctScoreOdds: Object.fromEntries(
        ["0-0", "1-0", "0-1", "1-1", "2-0", "0-2", "2-1", "1-2"].map((scoreline) => [
          scoreline,
          getCorrectScoreOdds(baseMatch, scoreline),
        ]),
      ),
      overUnderOdds: {
        2.5: {
          over: getOverUnderOdds(baseMatch, 2.5, "over"),
          under: getOverUnderOdds(baseMatch, 2.5, "under"),
        },
        3.5: {
          over: getOverUnderOdds(baseMatch, 3.5, "over"),
          under: getOverUnderOdds(baseMatch, 3.5, "under"),
        },
      },
    };

    await writeState({ ...state, matches: [match, ...state.matches] });
    return { matchId: match.id };
  });

export const updateMatchAction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().min(1),
      patch: z.object({
        sport: z.string().min(1).optional(),
        league: z.string().min(1).optional(),
        home: z.string().min(1).optional(),
        away: z.string().min(1).optional(),
        status: z.enum(["upcoming", "live", "settled"]).optional(),
        minute: z.string().min(1).optional(),
        score: z.string().min(1).optional(),
        homeOdds: z.number().positive().optional(),
        drawOdds: z.number().positive().optional(),
        awayOdds: z.number().positive().optional(),
        featured: z.boolean().optional(),
        live: z.boolean().optional(),
        settledResult: z.enum(["home", "draw", "away"]).optional(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    const state = await readState();
    const nextMatches = state.matches.map((match) =>
      match.id === data.id ? { ...match, ...data.patch } : match,
    );
    await writeState({ ...state, matches: nextMatches });
    return { ok: true };
  });

export const settleMatchAction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      matchId: z.string().min(1),
      result: z.enum(["home", "draw", "away"]),
    }),
  )
  .handler(async ({ data }) => {
    const state = await readState();
    const match = state.matches.find((item) => item.id === data.matchId);
    if (!match) throw new Error("Match not found.");

    const nextMatches = state.matches.map((item) =>
      item.id === data.matchId
        ? { ...item, status: "settled" as const, live: false, settledResult: data.result }
        : item,
    );

    const nextState: AppState = {
      ...state,
      matches: nextMatches,
    };

    settleBets(nextState, data.matchId, data.result);
    appendNotification(nextState, {
      id: createId("notification"),
      title: "Match settled",
      message: `${match.home} vs ${match.away} is now settled.`,
      createdAt: new Date().toISOString(),
    });

    await writeState(nextState);
    return { ok: true };
  });

export const approveWithdrawalAction = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const state = await readState();
    const nextWithdrawals = state.withdrawals.map((withdrawal) =>
      withdrawal.id === data.id ? { ...withdrawal, status: "approved" as const } : withdrawal,
    );
    await writeState({ ...state, withdrawals: nextWithdrawals });
    return { ok: true };
  });

export const rejectWithdrawalAction = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const state = await readState();
    const nextWithdrawals = state.withdrawals.map((withdrawal) =>
      withdrawal.id === data.id ? { ...withdrawal, status: "rejected" as const } : withdrawal,
    );
    await writeState({ ...state, withdrawals: nextWithdrawals });
    return { ok: true };
  });

export const approveDepositAction = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const state = await readState();
    const deposit = state.deposits.find((item) => item.id === data.id);
    if (!deposit) throw new Error("Deposit not found.");

    const nextState: AppState = {
      ...state,
      users: state.users.map((user) =>
        user.id === deposit.userId
          ? { ...user, balance: Number((user.balance + deposit.amount).toFixed(2)) }
          : user,
      ),
      deposits: state.deposits.map((item) =>
        item.id === data.id ? { ...item, status: "approved" as const } : item,
      ),
      notifications: [
        {
          id: createId("notification"),
          title: "Deposit approved",
          message: `Funds were added for ${deposit.amount.toFixed(2)}.`,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    };

    await writeState(nextState);
    return { ok: true };
  });

export const rejectDepositAction = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const state = await readState();
    const nextState: AppState = {
      ...state,
      deposits: state.deposits.map((item) =>
        item.id === data.id ? { ...item, status: "rejected" as const } : item,
      ),
      notifications: [
        {
          id: createId("notification"),
          title: "Deposit rejected",
          message: "A requested wallet top-up was rejected.",
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    };

    await writeState(nextState);
    return { ok: true };
  });

export const approveKycAction = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const session = await getSession(SESSION_CONFIG);
    const state = await readState();
    const currentUser = getCurrentUser(state, session.data.userId ?? null);
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Admin access required.");
    }

    const nextState: AppState = {
      ...state,
      users: state.users.map((user) =>
        user.id === data.userId
          ? {
              ...user,
              kycStatus: "verified",
              kycReviewedAt: new Date().toISOString(),
            }
          : user,
      ),
      notifications: [
        {
          id: createId("notification"),
          title: "KYC approved",
          message: "A user verification was approved by admin.",
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    };

    await writeState(nextState);
    return { ok: true };
  });
