/**
 * Supabase client singleton.
 *
 * Reads configuration from Vite env vars. Persists the session in
 * localStorage so users stay signed in across page reloads.
 */
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Did you copy .env.example to .env?",
  );
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

/** Base URL of the deployed Edge Function. */
export const API_BASE_URL = `${url}/functions/v1/approval-api`;
