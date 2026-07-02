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
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
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
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";
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

const FIREBASE_SEEDS = [
  { email: "admin@wtbet.local", password: "admin123", name: "W&T Admin" },
  { email: "player@wtbet.local", password: "player123", name: "Demo Bettor" },
];

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
  const firebaseAuth = useMemo(() => getFirebaseAuth(), []);

  const ensureFirebaseSeedAccounts = useCallback(async () => {
    if (!firebaseAuth || firebaseAuth.currentUser) return;
    if (window.localStorage.getItem("wt-bet-firebase-seeded") === "1") return;

    for (const seed of FIREBASE_SEEDS) {
      try {
        const credential = await createUserWithEmailAndPassword(
          firebaseAuth,
          seed.email,
          seed.password,
        );
        await updateProfile(credential.user, { displayName: seed.name });
      } catch {
        // The account probably already exists in Firebase Auth.
      } finally {
        if (firebaseAuth.currentUser) {
          await firebaseSignOut(firebaseAuth).catch(() => {
            // Keep moving if sign-out fails during bootstrap.
          });
        }
      }
    }

    window.localStorage.setItem("wt-bet-firebase-seeded", "1");
  }, [firebaseAuth]);

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

    if (isFirebaseConfigured() && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (authUser) => {
        if (authUser) {
          setSnapshot((current) => {
            const match = current.users.find((user) => user.email === authUser.email) ?? null;
            if (!match || current.currentUserId === match.id) {
              return current;
            }

            return {
              ...current,
              currentUserId: match.id,
            };
          });
        }
      });

      ensureFirebaseSeedAccounts().catch(() => {
        // Seed bootstrapping is best-effort.
      });

      refresh()
        .catch(() => {
          // Keep the local fallback snapshot if the server is unavailable.
        })
        .finally(() => {
          setHydrated(true);
        });

      return () => unsubscribe();
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
        if (firebaseAuth) {
          createUserWithEmailAndPassword(firebaseAuth, input.email, input.password)
            .then(async (credential) => {
              await updateProfile(credential.user, { displayName: input.name });
            })
            .catch(() => {
              // Firebase is optional here; the app's own auth remains the source of truth.
            });
        }
        await refresh();
        return result.userId;
      },
      signIn: async (input) => {
        const result = await signInAction({ data: input });
        if (firebaseAuth) {
          signInWithEmailAndPassword(firebaseAuth, input.email, input.password).catch(() => {
            // Keep backend session login working even if Firebase auth is not ready.
          });
        }
        await refresh();
        return result.userId;
      },
      signOut: async () => {
        if (firebaseAuth) {
          await firebaseSignOut(firebaseAuth);
        }
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
      ensureFirebaseSeedAccounts,
      snapshot.bets,
      snapshot.currentUserId,
      snapshot.matches,
      snapshot.notifications,
      snapshot.users,
      snapshot.withdrawals,
      firebaseAuth,
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
