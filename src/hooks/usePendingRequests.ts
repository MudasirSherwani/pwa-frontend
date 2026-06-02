/**
 * Real-time hooks for approval requests, backed by Supabase Realtime.
 *
 * Strategy: do an initial REST fetch to populate the UI immediately,
 * then subscribe to Postgres-change notifications via a Realtime channel.
 *
 * Important: channel names must be UNIQUE per mount because React strict
 * mode mounts effects twice in development. Reusing a channel name causes
 * "cannot add callbacks after subscribe()" because the second mount hits
 * an already-subscribed channel.
 */
import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import { api } from "../services/api";
import type { ApprovalRequest } from "../types";

export function usePendingRequests(max = 100) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Unique per-mount channel name avoids collisions in strict mode.
    const channelName = `approval-requests-pending:${crypto.randomUUID()}`;
    const channel: RealtimeChannel = supabase.channel(channelName);

    // 1. Register the change handler BEFORE subscribe()
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "approval_requests" },
      (payload) => {
        setRequests((prev) => applyChange(prev, payload, max));
      },
    );

    // 2. Subscribe
    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn("Realtime channel error:", status);
      }
    });

    // 3. Initial snapshot via REST (runs in parallel; that's fine)
    api
      .pending()
      .then((rows) => {
        if (!cancelled) {
          setRequests(rows.slice(0, max));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [max]);

  return { requests, loading, error };
}

export function useRequest(requestId: string | undefined) {
  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;
    const channelName = `approval-request:${requestId}:${crypto.randomUUID()}`;
    const channel: RealtimeChannel = supabase.channel(channelName);

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "approval_requests",
        filter: `request_id=eq.${requestId}`,
      },
      (payload) => {
        setRequest(payload.new as ApprovalRequest);
      },
    );

    channel.subscribe();

    api
      .status(requestId)
      .then((r) => {
        if (!cancelled) {
          setRequest(r);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  return { request, loading };
}

// ---- helpers --------------------------------------------------------------

interface ChangePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown> | ApprovalRequest;
  old: Record<string, unknown> | ApprovalRequest;
}

function applyChange(
  prev: ApprovalRequest[],
  payload: ChangePayload,
  max: number,
): ApprovalRequest[] {
  const next = [...prev];
  const newRow = payload.new as ApprovalRequest | undefined;
  const oldRow = payload.old as ApprovalRequest | undefined;

  if (payload.eventType === "INSERT" && newRow) {
    if (newRow.status === "Pending") next.unshift(newRow);
  } else if (payload.eventType === "UPDATE" && newRow) {
    const idx = next.findIndex((r) => r.request_id === newRow.request_id);
    if (newRow.status === "Pending") {
      if (idx >= 0) next[idx] = newRow;
      else next.unshift(newRow);
    } else {
      if (idx >= 0) next.splice(idx, 1);
    }
  } else if (payload.eventType === "DELETE" && oldRow) {
    const idx = next.findIndex((r) => r.request_id === oldRow.request_id);
    if (idx >= 0) next.splice(idx, 1);
  }

  return next.slice(0, max);
}