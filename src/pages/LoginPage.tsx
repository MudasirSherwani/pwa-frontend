import { type FormEvent, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Icon } from "../components/Icon";

export function LoginPage() {
  const { user, ready, signIn } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) return null;
  if (user) {
    const to = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={to} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      toast.push({
        kind: "error",
        title: "Sign-in failed",
        body: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-grain flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-ink-200/70 bg-white shadow-lift dark:border-ink-800 dark:bg-ink-900 md:grid-cols-2">
        {/* Editorial side */}
        <div className="relative hidden bg-ink-900 px-10 py-14 text-ink-50 md:flex md:flex-col md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-accent">
              <Icon.Sparkle width={18} height={18} />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                Approval Console
              </span>
            </div>
            <h1 className="mt-8 font-display text-5xl font-semibold leading-tight tracking-tight">
              Decisions, on
              <br />
              <span className="italic text-accent">your</span> time.
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink-300">
              Review, approve, and reject business transactions from anywhere.
              Built for owners who don't sit at a desk.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 text-ink-400">
              <span className="h-1 w-1 rounded-full bg-accent" />
              Real-time sync with your ERP
            </div>
            <div className="flex items-center gap-2 text-ink-400">
              <span className="h-1 w-1 rounded-full bg-accent" />
              Instant push notifications
            </div>
            <div className="flex items-center gap-2 text-ink-400">
              <span className="h-1 w-1 rounded-full bg-accent" />
              Tamper-evident audit trail
            </div>
          </div>
        </div>

        {/* Form side */}
        <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
          <div className="mb-8">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Sign in to continue to the approval console.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="owner@company.com"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "Signing in…" : "Sign in"}
              {!busy && <Icon.Arrow width={16} height={16} />}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-ink-400 dark:text-ink-500">
            Protected workflow · Firebase Auth · TLS 1.3
          </p>
        </div>
      </div>
    </div>
  );
}
