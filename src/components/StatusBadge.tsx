import type { ApprovalStatus } from "../types";

const styles: Record<ApprovalStatus, string> = {
  Pending: "bg-warn-soft text-warn-700 dark:bg-warn/15 dark:text-warn-soft",
  Approved: "bg-success-soft text-emerald-800 dark:bg-success/15 dark:text-success-soft",
  Rejected: "bg-danger-soft text-red-800 dark:bg-danger/15 dark:text-danger-soft",
  Expired: "bg-ink-100 text-ink-600 dark:bg-ink-700/50 dark:text-ink-300",
  Cancelled: "bg-ink-100 text-ink-600 dark:bg-ink-700/50 dark:text-ink-300",
  Processed: "bg-ink-900 text-ink-50 dark:bg-ink-50 dark:text-ink-900",
};

const dots: Record<ApprovalStatus, string> = {
  Pending: "bg-warn",
  Approved: "bg-success",
  Rejected: "bg-danger",
  Expired: "bg-ink-400",
  Cancelled: "bg-ink-400",
  Processed: "bg-accent",
};

export function StatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span className={`badge ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {status}
    </span>
  );
}
