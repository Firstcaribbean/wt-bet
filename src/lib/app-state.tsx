import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  approveKycAction,
  approveWithdrawalAction,
  createLocalMatchAction,
  fetchBootstrapState,
  placeAccumulatorBetAction,
  placeBetAction,
  rejectWithdrawalAction,
  requestWithdrawalAction,
  settleMatchAction,
  signInAction,
  signOutAction,
  signUpAction,
  updateMatchAction,
  verifyKycAction,
} from "./app-backend.server";
import {
  createInitialState,
  type AppSnapshot,
  type Bet,
  type BetStatus,
  type KycStatus,
  type Match,
  type MatchStatus,
  type Notification,
  type Role,
  type User,
  type Withdrawal,
  type WithdrawalStatus,
} from "./app-model";

export type {
  Bet,
  BetStatus,
  KycStatus,
  Match,
  MatchStatus,
  Notification,
  Role,
  User,
  Withdrawal,
  WithdrawalStatus,
} from "./app-model";

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
  signUp: (input: { name: string; email: string; password: string }) => Promise<string>;
  signIn: (input: { email: string; password: string }) => Promise<string>;
  signOut: () => Promise<void>;
  placeBet: (input: {
    matchId: string;
    selection: "home" | "draw" | "away";
    stake: number;
  }) => Promise<string>;
  placeAccumulatorBet: (input: {
    selections: Array<{ matchId: string; selection: "home" | "draw" | "away" }>;
    stake: number;
  }) => Promise<string>;
  requestWithdrawal: (amount: number) => Promise<string>;
  verifyKyc: () => Promise<void>;
  createLocalMatch: (
    input: Omit<Match, "id" | "status"> & { status?: MatchStatus },
  ) => Promise<string>;
  updateMatch: (id: string, patch: Partial<Match>) => Promise<void>;
  settleMatch: (input: { matchId: string; result: "home" | "draw" | "away" }) => Promise<void>;
  approveWithdrawal: (id: string) => Promise<void>;
  rejectWithdrawal: (id: string) => Promise<void>;
  approveKyc: (userId: string) => Promise<void>;
};

const AppStoreContext = createContext<StoreShape | null>(null);

function createSnapshot(currentUserId: string | null): AppSnapshot {
  const initial = createInitialState();
  return {
    ...initial,
    currentUserId,
  };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [theme, setThemeState] = useState<"light" | "dark">("dark");
  const [snapshot, setSnapshot] = useState<AppSnapshot>(() => createSnapshot(null));

  const refresh = useCallback(async () => {
    const next = await fetchBootstrapState();
    setSnapshot(next);
    return next;
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("wt-bet-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setThemeState(savedTheme);
    }

    refresh()
      .catch(() => {
        // Keep the local fallback snapshot if the server is unavailable.
      })
      .finally(() => {
        setHydrated(true);
      });
  }, [refresh]);

  useEffect(() => {
    if (!hydrated) return;
    const interval = window.setInterval(() => {
      refresh().catch(() => {
        // Ignore background refresh failures and keep the current snapshot.
      });
    }, 15000);

    return () => window.clearInterval(interval);
  }, [hydrated, refresh]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("wt-bet-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [hydrated, theme]);

  const currentUser = snapshot.users.find((user) => user.id === snapshot.currentUserId) ?? null;

  const value = useMemo<StoreShape>(
    () => ({
      hydrated,
      theme,
      setTheme: setThemeState,
      users: snapshot.users,
      currentUserId: snapshot.currentUserId,
      currentUser,
      matches: snapshot.matches,
      bets: snapshot.bets,
      withdrawals: snapshot.withdrawals,
      notifications: snapshot.notifications,
      signUp: async (input) => {
        const result = await signUpAction({ data: input });
        await refresh();
        return result.userId;
      },
      signIn: async (input) => {
        const result = await signInAction({ data: input });
        await refresh();
        return result.userId;
      },
      signOut: async () => {
        await signOutAction();
        await refresh();
      },
      placeBet: async (input) => {
        const result = await placeBetAction({ data: input });
        await refresh();
        return result.betId;
      },
      placeAccumulatorBet: async (input) => {
        const result = await placeAccumulatorBetAction({ data: input });
        await refresh();
        return result.betId;
      },
      requestWithdrawal: async (amount) => {
        const result = await requestWithdrawalAction({ data: { amount } });
        await refresh();
        return result.withdrawalId;
      },
      verifyKyc: async () => {
        await verifyKycAction();
        await refresh();
      },
      createLocalMatch: async (input) => {
        const result = await createLocalMatchAction({ data: input });
        await refresh();
        return result.matchId;
      },
      updateMatch: async (id, patch) => {
        await updateMatchAction({ data: { id, patch } });
        await refresh();
      },
      settleMatch: async (input) => {
        await settleMatchAction({ data: input });
        await refresh();
      },
      approveWithdrawal: async (id) => {
        await approveWithdrawalAction({ data: { id } });
        await refresh();
      },
      rejectWithdrawal: async (id) => {
        await rejectWithdrawalAction({ data: { id } });
        await refresh();
      },
      approveKyc: async (userId) => {
        await approveKycAction({ data: { userId } });
        await refresh();
      },
    }),
    [
      currentUser,
      hydrated,
      snapshot.bets,
      snapshot.currentUserId,
      snapshot.matches,
      snapshot.notifications,
      snapshot.users,
      snapshot.withdrawals,
      theme,
      refresh,
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
