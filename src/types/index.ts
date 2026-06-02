/**
 * Domain types for the PWA.
 * Matches the snake_case shape coming back from PostgREST/Edge Functions.
 */

export type ApprovalStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Expired"
  | "Cancelled"
  | "Processed";

export type RequestType =
  | "Sales"
  | "Payment"
  | "Inventory"
  | "VehicleSale"
  | "Discount"
  | "Finance"
  | "Other";

/**
 * Snake-case row coming from Postgres via PostgREST or the Edge Function.
 * We keep this naming because it's what Realtime subscriptions emit.
 */
export interface ApprovalRequest {
  request_id: string;
  transaction_id: string;
  request_type: RequestType;
  customer_name: string;
  amount: number;
  currency: string;
  requested_by: string;
  requested_by_name: string;
  requested_at: string;          // ISO timestamp
  status: ApprovalStatus;
  remarks: string;
  approval_remarks: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  device_info: string | null;
  expires_at: string;
  token: string;
  is_processed: boolean;
  attachments: string[] | null;
  metadata: Record<string, unknown> | null;
}

export interface DashboardStats {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
  totalToday: number;
  recent: ApprovalRequest[];
}

export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
}
