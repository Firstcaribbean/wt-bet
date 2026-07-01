import { createServerFn } from "@tanstack/react-start";
import { clearSession, getSession, updateSession } from "@tanstack/react-start/server";
import { kv } from "@vercel/kv";
import { randomBytes, pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  createId,
  createInitialState,
  type AppState,
  type AppStateBootstrap,
  type Bet,
  type Match,
  type Notification,
  type User,
  type Withdrawal,
} from "./app-model";

const STATE_KEY = "wt-bet:state";
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

const hasKv =
  Boolean(process.env.KV_REST_API_URL) &&
  Boolean(process.env.KV_REST_API_TOKEN) &&
  Boolean(process.env.KV_REST_API_READ_ONLY_TOKEN);

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
  if (hasKv) {
    const stored = await kv.get<AppState>(STATE_KEY);
    if (stored) {
      return normalizeState(stored);
    }
    const seed = normalizeState(createInitialState());
    await kv.set(STATE_KEY, seed);
    return seed;
  }

  if (!memoryState) {
    memoryState = normalizeState(createInitialState());
  }

  return cloneState(memoryState);
}

async function writeState(state: AppState) {
  const next = normalizeState(state);
  if (hasKv) {
    await kv.set(STATE_KEY, next);
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

function settleBets(state: AppState, matchId: string, result: "home" | "draw" | "away") {
  state.bets = state.bets.map((bet) => {
    if (bet.status !== "open") return bet;

    const legForMatch = bet.legs.find((leg) => leg.matchId === matchId);
    if (!legForMatch) return bet;

    if (bet.kind === "single") {
      const won = legForMatch.selection === result;
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
  const state = await readState();
  const session = await getSession(SESSION_CONFIG);
  const currentUserId = session.data.userId ?? null;
  return { ...state, currentUserId };
}

export const fetchBootstrapState = createServerFn({ method: "GET" }).handler(async () => {
  return getBootstrapState();
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
      selection: z.enum(["home", "draw", "away"]),
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

    const odds =
      data.selection === "home"
        ? match.homeOdds
        : data.selection === "draw"
          ? match.drawOdds
          : match.awayOdds;
    const pick =
      data.selection === "home" ? match.home : data.selection === "draw" ? "Draw" : match.away;

    const bet: Bet = {
      id: createId("bet"),
      userId: currentUser.id,
      matchId: data.matchId,
      kind: "single",
      selection: data.selection,
      pick,
      stake: data.stake,
      odds,
      potentialPayout: Number((data.stake * odds).toFixed(2)),
      status: "open",
      placedAt: new Date().toISOString(),
      legs: [{ matchId: data.matchId, selection: data.selection, pick, odds }],
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
          message: `${pick} on ${match.home} vs ${match.away}`,
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
            selection: z.enum(["home", "draw", "away"]),
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
        const odds =
          item.selection === "home"
            ? match.homeOdds
            : item.selection === "draw"
              ? match.drawOdds
              : match.awayOdds;
        const pick =
          item.selection === "home" ? match.home : item.selection === "draw" ? "Draw" : match.away;
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
      user.id === currentUser.id ? { ...user, kycStatus: "pending" } : user,
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
    const match: Match = {
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
        user.id === data.userId ? { ...user, kycStatus: "verified" } : user,
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
