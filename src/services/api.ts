/**
 * Typed REST client for the approval Edge Function.
 *
 * Each call is prefixed with the function base URL, signed with the
 * current Supabase access token, retried once on transient failure,
 * and unwrapped from the { ok, data, error } envelope.
 */
import { supabase, API_BASE_URL } from "./supabase";
import type {
  ApiEnvelope,
  ApprovalRequest,
  ApprovalStatus,
  DashboardStats,
  RequestType,
} from "../types";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token
    ? { Authorization: `Bearer ${data.session.access_token}` }
    : {};
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(await authHeader()),
  };

  const doFetch = () =>
    fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

  let response: Response;
  try {
    response = await doFetch();
  } catch {
    response = await doFetch().catch(() => {
      throw new ApiError("NETWORK", "Network request failed", 0);
    });
  }

  const text = await response.text();
  let parsed: ApiEnvelope<T> | null = null;
  try {
    parsed = text ? (JSON.parse(text) as ApiEnvelope<T>) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok || !parsed?.ok) {
    throw new ApiError(
      parsed?.error?.code ?? "HTTP_ERROR",
      parsed?.error?.message ?? response.statusText,
      response.status,
      parsed?.error?.details,
    );
  }
  return parsed.data as T;
}

export const api = {
  pending: () => request<ApprovalRequest[]>("GET", "/pendingRequests"),

  history: (filter?: { status?: ApprovalStatus; limit?: number }) => {
    const qs = new URLSearchParams();
    if (filter?.status) qs.set("status", filter.status);
    if (filter?.limit) qs.set("limit", String(filter.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<ApprovalRequest[]>("GET", `/approvalHistory${suffix}`);
  },

  status: (requestId: string) =>
    request<ApprovalRequest>("GET", `/requestStatus/${encodeURIComponent(requestId)}`),
  
  approve: (input: {
    requestId: string;
    token: string;
    approvalRemarks?: string;
  }) => request<ApprovalRequest>("POST", "/approveRequest", input),

  reject: (input: {
    requestId: string;
    token: string;
    approvalRemarks?: string;
  }) => request<ApprovalRequest>("POST", "/rejectRequest", input),

  dashboard: () => request<DashboardStats>("GET", "/dashboard"),

  registerDevice: (input: {
    pushToken: string;
    platform: "web" | "android" | "ios";
    deviceLabel?: string;
  }) => request<{ deviceId: string }>("POST", "/registerDevice", input),

  // For completeness; the PWA doesn't normally create requests
  create: (input: {
    transactionId: string;
    requestType: RequestType;
    customerName: string;
    amount: number;
    requestedBy: string;
    requestedByName: string;
    remarks: string;
  }) => request<ApprovalRequest>("POST", "/createApprovalRequest", input),
};
