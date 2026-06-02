/**
 * Authentication context — Supabase Auth edition.
 *
 * Resilient to:
 *   - Expired sessions on app reload
 *   - Strict-mode double-mount
 *   - Slow / failed profile fetches (UI still becomes "ready")
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  roles: string[];
  active: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, display_name, roles, active")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.warn("[auth] profile fetch error:", error.message);
      return null;
    }
    return data as UserProfile | null;
  } catch (e) {
    console.warn("[auth] profile fetch threw:", e);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Belt-and-braces: never let the app sit on "Loading…" for more
    // than ~5 seconds. If auth hasn't resolved by then, flip ready=true
    // anyway. The session will still update if/when it eventually arrives.
    const readyTimeout = window.setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 5000);

    // 1. Subscribe FIRST so we don't miss the INITIAL_SESSION event
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (cancelled) return;
      console.debug("[auth] state change:", event, !!s);
      setSession(s);
      setReady(true);

      // Load profile in the background; UI doesn't block on it
      if (s?.user) {
        fetchProfile(s.user.id).then((p) => {
          if (!cancelled) setProfile(p);
        });
      } else {
        setProfile(null);
      }
    });

    // 2. Then hydrate from any persisted session. If the listener fires
    //    first (which it usually does), this is a no-op; otherwise we
    //    pick up the session here.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        // Don't overwrite if the listener already populated it
        setSession((prev) => prev ?? data.session);
        setReady(true);
        if (data.session?.user) {
          fetchProfile(data.session.user.id).then((p) => {
            if (!cancelled && !profile) setProfile(p);
          });
        }
      })
      .catch((e) => {
        console.warn("[auth] getSession threw:", e);
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
      clearTimeout(readyTimeout);
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const p = await fetchProfile(session.user.id);
      setProfile(p);
    }
  }, [session]);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      ready,
      signIn,
      signOut,
      refreshProfile,
    }),
    [session, profile, ready, signIn, signOut, refreshProfile],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}