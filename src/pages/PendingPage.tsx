/**
 * Pending requests list page.
 *
 * Uses the real-time Realtime subscription so the list updates the moment
 * a new request lands.
 */
import { Link } from "react-router-dom";
import { usePendingRequests } from "../hooks/usePendingRequests";
import { StatusBadge } from "../components/StatusBadge";
import { Icon } from "../components/Icon";
import { formatAmount, formatRelative } from "../utils/format";

export function PendingPage() {
  const { requests, loading, error } = usePendingRequests();

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <div className="text-sm text-ink-400">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <div className="font-display text-lg font-semibold text-danger">
          Could not load pending requests
        </div>
        <div className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Pending
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {requests.length === 0
              ? "Nothing awaiting your decision"
              : `${requests.length} request${requests.length === 1 ? "" : "s"} awaiting your decision`}
          </p>
        </div>
      </header>

      {requests.length === 0 ? (
        <div className="card grid place-items-center py-24 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-success-soft text-success">
            <Icon.Check width={26} height={26} />
          </div>
          <div className="mt-5 font-display text-2xl font-semibold">
            All caught up
          </div>
          <div className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            New requests will appear here in real time.
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {requests.map((r) => {
            const customerName = r.customer_name ?? "—";
            const initial = customerName.charAt(0).toUpperCase() || "?";
            return (
              <li key={r.request_id}>
                <Link
                  to={`/requests/${r.request_id}`}
                  className="card group flex items-center gap-4 p-4 transition-all hover:border-accent/60 hover:shadow-lift"
                >
                  <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-ink-100 font-display text-base font-semibold text-ink-700 dark:bg-ink-800 dark:text-ink-200">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate font-semibold text-ink-900 dark:text-ink-50">
                        {customerName}
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-400">
                      #{r.transaction_id ?? "—"} · by{" "}
                      {r.requested_by_name ?? r.requested_by ?? "—"} ·{" "}
                      {formatRelative(r.requested_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-semibold tabular-nums">
                      {formatAmount(r.amount, r.currency)}
                    </div>
                    <div className="text-xs uppercase tracking-wider text-ink-400 dark:text-ink-500">
                      {r.request_type}
                    </div>
                  </div>
                  <Icon.Chevron
                    width={16}
                    height={16}
                    className="hidden text-ink-400 transition-transform group-hover:translate-x-0.5 sm:block"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}