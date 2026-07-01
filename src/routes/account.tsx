import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { BadgeCheck, LogOut, LockKeyhole, Wallet } from "lucide-react";
import { useAppStore } from "../lib/app-state";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

function AccountPage() {
  const {
    currentUser,
    bets,
    withdrawals,
    notifications,
    signUp,
    signIn,
    signOut,
    verifyKyc,
    requestWithdrawal,
  } = useAppStore();

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(currentUser?.email ?? "player@wtbet.local");
  const [password, setPassword] = useState("player123");
  const [withdrawAmount, setWithdrawAmount] = useState("50");
  const [message, setMessage] = useState<string | null>(null);

  const myBets = useMemo(
    () => bets.filter((bet) => bet.userId === currentUser?.id).slice(0, 8),
    [bets, currentUser?.id],
  );
  const myWithdrawals = useMemo(
    () => withdrawals.filter((item) => item.userId === currentUser?.id).slice(0, 5),
    [withdrawals, currentUser?.id],
  );
  const myNotifications = useMemo(() => notifications.slice(0, 4), [notifications]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (mode === "sign-up") {
        await signUp({ name, email, password });
        setMessage("Account created and signed in.");
      } else {
        await signIn({ email, password });
        setMessage("Signed in successfully.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  const handleWithdrawal = async () => {
    try {
      await requestWithdrawal(Number(withdrawAmount));
      setMessage("Withdrawal request created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to request withdrawal.");
    }
  };

  const balance = currentUser?.balance ?? 0;

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Account</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Login, wallet, and KYC</h1>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Back home
          </Link>
        </div>

        {message ? (
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-card">
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  {currentUser ? "Signed in" : "Get started"}
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold">
                  {currentUser
                    ? `Welcome back, ${currentUser.name}`
                    : "Create your W&T Bet account"}
                </h2>
              </div>
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-secondary"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              ) : null}
            </div>

            <div className="mt-6 flex gap-2">
              {["sign-in", "sign-up"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMode(tab as "sign-in" | "sign-up")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    mode === tab
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-surface hover:bg-secondary"
                  }`}
                >
                  {tab === "sign-in" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              {mode === "sign-up" ? (
                <label className="grid gap-2 text-sm font-medium">
                  Full name
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </label>
              ) : null}
              <label className="grid gap-2 text-sm font-medium">
                Email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                  className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Password
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                  className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <button
                type="submit"
                className="rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                {mode === "sign-in" ? "Sign in" : "Create account"}
              </button>
            </form>

            {currentUser ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Balance
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold tabular-nums">
                    ${balance.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    KYC
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold capitalize">
                    {currentUser.kycStatus}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Role
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold capitalize">
                    {currentUser.role}
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold">Wallet actions</h2>
              </div>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-2 text-sm font-medium">
                  Withdrawal amount
                  <input
                    value={withdrawAmount}
                    onChange={(event) => setWithdrawAmount(event.target.value)}
                    type="number"
                    min="0"
                    className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleWithdrawal}
                  className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Request withdrawal
                </button>
                <p className="text-xs leading-5 text-muted-foreground">
                  Withdrawals apply the 10% service fee and should only unlock after KYC.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-accent" />
                <h2 className="font-display text-lg font-bold">KYC status</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Verification is required before withdrawals are approved.
              </p>
              <button
                type="button"
                onClick={() => void verifyKyc()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                <LockKeyhole className="h-4 w-4" />
                Submit verification
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-display text-lg font-bold">Recent activity</h2>
              <div className="mt-4 space-y-3">
                {myBets.length > 0 ? (
                  myBets.map((bet) => (
                    <div
                      key={bet.id}
                      className="rounded-lg border border-border bg-surface p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{bet.pick}</span>
                        <span className="font-semibold uppercase">{bet.status}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Stake ${bet.stake.toFixed(2)} · payout ${bet.potentialPayout.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No bets yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-display text-lg font-bold">Withdrawals</h2>
              <div className="mt-4 space-y-3">
                {myWithdrawals.length > 0 ? (
                  myWithdrawals.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border bg-surface p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span>${item.amount.toFixed(2)}</span>
                        <span className="font-semibold uppercase">{item.status}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Fee ${item.serviceFee.toFixed(2)} · net ${item.netAmount.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No withdrawals yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-display text-lg font-bold">Alerts</h2>
              <div className="mt-4 space-y-2">
                {myNotifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border bg-surface p-3 text-sm"
                  >
                    <div className="font-semibold">{item.title}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
