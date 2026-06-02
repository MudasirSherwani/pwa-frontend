/**
 * Approval detail screen.
 *
 * Displays the full request and exposes the two terminal actions
 * (approve / reject). Both go through a confirm modal that captures
 * optional approver remarks.
 */
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useRequest } from "../hooks/usePendingRequests";
import { useToast } from "../contexts/ToastContext";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { Icon } from "../components/Icon";
import {
  formatAmount,
  formatDateTime,
  formatRelative,
  toDate,
} from "../utils/format";

type Action = "approve" | "reject" | null;

export function RequestDetailPage() {
  const params = useParams();
  // Support both /:id (current) and /:requestId (just in case)
  const request_id = params.id ?? params.request_id;
  const navigate = useNavigate();
  const toast = useToast();
  const { request, loading } = useRequest(request_id);

  const [action, setAction] = useState<Action>(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  if (!request_id) {
    return (
      <div className="card p-6 text-center">
        <div className="font-display text-lg font-semibold">Bad URL</div>
        <div className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          No request ID in the URL.
        </div>
        <Link to="/pending" className="btn-primary mt-4 inline-flex">
          Back to pending
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card grid place-items-center py-20">
        <div className="text-sm text-ink-400">Loading request…</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="card p-6 text-center">
        <div className="font-display text-lg font-semibold">Request not found</div>
        <div className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Either it was deleted, or you don't have permission to view it.
        </div>
        <div className="mt-2 font-mono text-xs text-ink-400">id: {request_id}</div>
        <Link to="/pending" className="btn-primary mt-4 inline-flex">
          Back to pending
        </Link>
      </div>
    );
  }

  const isPending = request.status === "Pending";
  const expiresAt = toDate(request.expires_at);
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;

  const submit = async () => {
    if (!action || !request) return;
    setBusy(true);
    try {
      const fn = action === "approve" ? api.approve : api.reject;
      await fn({
        requestId: request.request_id,
        token: request.token,
        approvalRemarks: remarks.trim() || undefined,
      });
      toast.push({
        kind: action === "approve" ? "success" : "info",
        title: action === "approve" ? "Approved" : "Rejected",
        body: `${request.customer_name ?? ""} · ${formatAmount(request.amount, request.currency)}`,
      });
      setAction(null);
      setRemarks("");
      navigate("/pending");
    } catch (err) {
      toast.push({
        kind: "error",
        title: "Action failed",
        body: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <Link
          to="/pending"
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-50"
        >
          <Icon.Arrow width={14} height={14} className="rotate-180" />
          Back to pending
        </Link>
      </div>

      {/* Hero card */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-200/70 px-6 py-5 dark:border-ink-700/70">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                {request.request_type} · #{request.transaction_id}
              </div>
              <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
                {request.customer_name ?? "—"}
              </h1>
            </div>
            <StatusBadge status={request.status} />
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
              Amount
            </div>
            <div className="mt-1 font-display text-4xl font-semibold tabular-nums">
              {formatAmount(request.amount, request.currency)}
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <MetaRow
              label="Requested by"
              value={request.requested_by_name ?? request.requested_by ?? "—"}
            />
            <MetaRow
              label="Requested"
              value={`${formatDateTime(request.requested_at)} · ${formatRelative(request.requested_at)}`}
            />
            {isPending && expiresAt && (
              <MetaRow
                label={isExpired ? "Expired" : "Expires"}
                value={`${formatDateTime(request.expires_at)} · ${formatRelative(request.expires_at)}`}
              />
            )}
            {request.approved_by_name && (
              <MetaRow label="Decided by" value={request.approved_by_name} />
            )}
            {request.approved_at && (
              <MetaRow label="Approved at" value={formatDateTime(request.approved_at)} />
            )}
            {request.rejected_at && (
              <MetaRow label="Rejected at" value={formatDateTime(request.rejected_at)} />
            )}
          </div>
        </div>

        {request.remarks && (
          <div className="border-t border-ink-200/70 px-6 py-5 dark:border-ink-700/70">
            <div className="text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
              Requester remarks
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-200">
              {request.remarks}
            </p>
          </div>
        )}

        {request.approval_remarks && (
          <div className="border-t border-ink-200/70 px-6 py-5 dark:border-ink-700/70">
            <div className="text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
              Approver remarks
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-200">
              {request.approval_remarks}
            </p>
          </div>
        )}
      </div>

      {/* Action bar */}
      {isPending && !isExpired && (
        <div className="card p-4">
          {action === null ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => setAction("reject")}
                className="btn-danger"
              >
                <Icon.X width={16} height={16} />
                Reject
              </button>
              <button
                onClick={() => setAction("approve")}
                className="btn-success"
              >
                <Icon.Check width={16} height={16} />
                Approve
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-semibold">
                Confirm {action === "approve" ? "approval" : "rejection"}
              </div>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes for the audit log…"
                rows={3}
                className="input"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={() => {
                    setAction(null);
                    setRemarks("");
                  }}
                  className="btn-ghost"
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={busy}
                  className={action === "approve" ? "btn-success" : "btn-danger"}
                >
                  {busy
                    ? "Submitting…"
                    : action === "approve"
                    ? "Confirm approval"
                    : "Confirm rejection"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isPending && (
        <div className="card p-4 text-center text-sm text-ink-500 dark:text-ink-400">
          This request is {request.status.toLowerCase()} and can no longer be modified.
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-ink-500 dark:text-ink-400">{label}</span>
      <span className="text-right font-medium text-ink-900 dark:text-ink-50">
        {value}
      </span>
    </div>
  );
}