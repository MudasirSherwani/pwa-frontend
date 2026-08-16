/**
 * Dashboard / Overview page.
 *
 * Aggregates today's activity and shows the most recent requests.
 * Backed by the /dashboard endpoint (count() aggregations on Firestore).
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useToast } from "../contexts/ToastContext";
import { Icon } from "../components/Icon";
import { StatusBadge } from "../components/StatusBadge";
import { formatAmount, formatRelative, formatRequestType } from "../utils/format";
import type { DashboardStats } from "../types";

interface Stat {
  label: string;
  value: number;
  hint: string;
  tone: "warn" | "success" | "danger" | "neutral";
}

const toneClass: Record<Stat["tone"], string> = {
  warn: "text-warn",
  success: "text-success",
  danger: "text-danger",
  neutral: "text-ink-900 dark:text-ink-50",
};

export function DashboardPage() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const { enable: enablePush } = usePushNotifications();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushOn, setPushOn] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted",
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await api.dashboard();
        if (active) setStats(data);
      } catch (err) {
        toast.push({
          kind: "error",
          title: "Could not load dashboard",
          body: err instanceof Error ? err.message : "Try again later",
        });
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const id = setInterval(load, 30_000); // refresh every 30s as fallback
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [toast]);

  const handleEnablePush = async () => {
    const ok = await enablePush();
    setPushOn(ok);
    toast.push({
      kind: ok ? "success" : "warn",
      title: ok ? "Notifications enabled" : "Notifications not granted",
      body: ok
        ? "You'll be alerted instantly for new approval requests."
        : "You can re-enable them from your browser settings.",
    });
  };

  const tiles: Stat[] = [
    {
      label: "Pending",
      value: stats?.pending ?? 0,
      hint: "Awaiting decision",
      tone: "warn",
    },
    {
      label: "Approved today",
      value: stats?.approvedToday ?? 0,
      hint: "Released to ERP",
      tone: "success",
    },
    {
      label: "Rejected today",
      value: stats?.rejectedToday ?? 0,
      hint: "Returned to requester",
      tone: "danger",
    },
    {
      label: "Total today",
      value: stats?.totalToday ?? 0,
      hint: "Across all types",
      tone: "neutral",
    },
  ];

  return (
    <div className="animate-fade-up space-y-8">
      {/* Greeting */}
      <header className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-ink-400 dark:text-ink-500">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </span>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Good{" "}
          {new Date().getHours() < 12
            ? "morning"
            : new Date().getHours() < 18
            ? "afternoon"
            : "evening"}
          ,{" "}
          <span className="italic text-accent">
            {profile?.display_name?.split(" ")[0] ?? "there"}
          </span>
          .
        </h1>
        <p className="mt-1 max-w-prose text-sm text-ink-500 dark:text-ink-400">
          Here's what's waiting on you today.
        </p>
      </header>

      {/* Push notification CTA */}
      {!pushOn && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-accent/20 text-accent-deep">
              <Icon.Bell width={18} height={18} />
            </div>
            <div>
              <div className="text-sm font-semibold">Enable push notifications</div>
              <div className="text-xs text-ink-500 dark:text-ink-400">
                Get alerted instantly when a new approval needs your attention.
              </div>
            </div>
          </div>
          <button onClick={handleEnablePush} className="btn-primary">
            Enable
          </button>
        </div>
      )}

      {/* Stat tiles */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-ink-400 dark:text-ink-500">
              {t.label}
            </div>
            <div
              className={`mt-3 font-display text-4xl font-semibold tracking-tight ${toneClass[t.tone]}`}
            >
              {loading ? (
                <span className="inline-block h-9 w-12 animate-pulse rounded bg-ink-100 dark:bg-ink-700" />
              ) : (
                t.value
              )}
            </div>
            <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">
              {t.hint}
            </div>
          </div>
        ))}
      </section>

      {/* Recent activity */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Recent activity
          </h2>
          <Link
            to="/history"
            className="text-xs font-semibold uppercase tracking-wider text-accent hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="card divide-y divide-ink-100 dark:divide-ink-700">
          {loading && (
            <div className="px-5 py-12 text-center text-sm text-ink-400">
              Loading…
            </div>
          )}
          {!loading && (!stats?.recent || stats.recent.length === 0) && (
            <div className="px-5 py-12 text-center">
              <div className="font-display text-2xl">Nothing yet today.</div>
              <div className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                When the office submits a request, it'll appear here.
              </div>
            </div>
          )}

          {stats?.recent.map((r, i) => {
  const customerName = r.customer_name ?? "—";
  return (
    <Link
      /* FIX: Falls back cleanly to loop index if r.request_id is blank */
      key={r.request_id || `recent-${i}`}
      to={`/requests/${r.request_id}`}
      className="block px-4 py-4 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/40 sm:px-5"
    >
      {/* Row 1: customer + status. Status sits to the right on every width. */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
            {customerName}
          </div>
          <div className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-400">
            {formatRequestType(r.request_type)} · by {r.requested_by_name ?? r.requested_by ?? "—"}
          </div>
        </div>
        <StatusBadge status={r.status} />
      </div>

      {/* Row 2: amount + time + chevron */}
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold tabular-nums text-ink-900 dark:text-ink-50">
            {formatAmount(r.amount, r.currency)}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-ink-400 dark:text-ink-500">
            {formatRelative(r.requested_at)}
          </span>
        </div>
        <Icon.Chevron
          width={16}
          height={16}
          className="flex-shrink-0 text-ink-300 dark:text-ink-500"
        />
      </div>
    </Link>
  );
})}
        </div>
      </section>
    </div>
  );
}