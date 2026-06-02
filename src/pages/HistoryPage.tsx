/**
 * Approval history. Filterable by status, paginated client-side
 * (server already enforces a hard limit of 500).
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../contexts/ToastContext";
import type { ApprovalRequest, ApprovalStatus } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { Icon } from "../components/Icon";
import { formatAmount, formatRelative } from "../utils/format";

const FILTERS: { label: string; value: ApprovalStatus | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
  { label: "Expired", value: "Expired" },
  { label: "Cancelled", value: "Cancelled" },
];

export function HistoryPage() {
  const toast = useToast();
  const [items, setItems] = useState<ApprovalRequest[]>([]);
  const [filter, setFilter] = useState<ApprovalStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .history({
        status: filter === "All" ? undefined : filter,
        limit: 200,
      })
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((err) =>
        toast.push({
          kind: "error",
          title: "Failed to load history",
          body: err instanceof Error ? err.message : "Try again",
        }),
      )
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter, toast]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (r) =>
        r.customer_name.toLowerCase().includes(q) ||
        r.transaction_id.toLowerCase().includes(q) ||
        r.requested_by_name.toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <div className="animate-fade-up space-y-6">
      <header>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-ink-400 dark:text-ink-500">
          Archive
        </span>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Approval history
        </h1>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.value
                  ? "bg-ink-900 text-ink-50 dark:bg-accent dark:text-ink-900"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search by customer, ID, or requester"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input sm:w-72"
        />
      </div>

      <div className="card overflow-hidden">
        {loading && (
          <div className="px-5 py-16 text-center text-sm text-ink-400">
            Loading history…
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-5 py-16 text-center">
            <div className="font-display text-2xl">No matching records.</div>
            <div className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Try a different filter or search term.
            </div>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <>
            {/* Desktop table */}
            <table className="hidden w-full sm:table">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-400 dark:border-ink-700 dark:text-ink-500">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Decided by</th>
                  <th className="px-5 py-3 font-medium">When</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                {filtered.map((r) => (
                  <tr
                    key={r.request_id}
                    className="transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/40"
                  >
                    <td className="px-5 py-3">
                      <div className="text-sm font-semibold">
                        {r.customer_name}
                      </div>
                      <div className="text-xs text-ink-400">
                        #{r.transaction_id}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-ink-500 dark:text-ink-400">
                      {r.request_type}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-sm font-semibold">
                      {formatAmount(r.amount, r.currency)}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {r.approved_by_name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-500 dark:text-ink-400">
                      {formatRelative(
                        r.approved_at ?? r.rejected_at ?? r.requested_at,
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/requests/${r.request_id}`}
                        className="text-xs font-semibold text-accent hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile list */}
            <ul className="divide-y divide-ink-100 sm:hidden dark:divide-ink-700">
              {filtered.map((r) => (
                <li key={r.request_id}>
                  <Link
                    to={`/requests/${r.request_id}`}
                    className="flex items-center gap-3 px-5 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {r.customer_name}
                      </div>
                      <div className="truncate text-xs text-ink-400">
                        #{r.transaction_id} ·{" "}
                        {formatRelative(
                          r.approved_at ?? r.rejected_at ?? r.requested_at,
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold">
                        {formatAmount(r.amount, r.currency)}
                      </div>
                      <div className="mt-0.5">
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                    <Icon.Chevron
                      width={16}
                      height={16}
                      className="text-ink-300"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
