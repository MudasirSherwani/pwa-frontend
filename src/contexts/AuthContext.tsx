/**
 * Authentication context — Supabase Auth edition.
 *
 * Tracks two things:
 *   - The Supabase Auth session (id, email, JWT)
 *   - The matching row in public.users (display_name, roles, active)
 *
 * The profile row is fetched on every sign-in and exposed as `profile`.
 * Components should read display name from `profile?.display_name`, not
 * from auth metadata.
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
  const { data, error } = await supabase
    .from("users")
    .select("id, email, display_name, roles, active")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Failed to load user profile:", error.message);
    return null;
  }
  return data as UserProfile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Hydrate from any persisted session, then subscribe to changes.
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session?.user) {
        const p = await fetchProfile(data.session.user.id);
        if (!cancelled) setProfile(p);
      }
      if (!cancelled) setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      if (cancelled) return;
      setSession(s);
      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        if (!cancelled) setProfile(p);
      } else {
        setProfile(null);
      }
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
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