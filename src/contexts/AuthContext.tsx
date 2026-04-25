import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/src/services/supabase';
import type { UserProfile } from '@/src/types/user';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<UserProfile, 'nickname' | 'avatar_url' | 'balance' | 'card_last4' | 'card_brand' | 'card_holder' | 'card_expiry'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('[auth] fetchProfile error', error);
    return null;
  }
  return (data as UserProfile) ?? null;
}

async function ensureProfile(userId: string, nickname: string): Promise<UserProfile | null> {
  const existing = await fetchProfile(userId);
  if (existing) return existing;
  const { data, error } = await supabase
    .from('users')
    .insert({ id: userId, nickname, balance: 1000 })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return await fetchProfile(userId);
    console.error('[auth] ensureProfile error', error);
    return null;
  }
  return data as UserProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        const p = await ensureProfile(
          data.session.user.id,
          (data.session.user.user_metadata?.nickname as string | undefined) ??
            data.session.user.email?.split('@')[0] ??
            'player',
        );
        if (active) setProfile(p);
        if (active) setStatus('signedIn');
      } else {
        if (active) setStatus('signedOut');
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next?.user) {
        const p = await ensureProfile(
          next.user.id,
          (next.user.user_metadata?.nickname as string | undefined) ??
            next.user.email?.split('@')[0] ??
            'player',
        );
        setProfile(p);
        setStatus('signedIn');
      } else {
        setProfile(null);
        setStatus('signedOut');
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, nickname: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const p = await fetchProfile(session.user.id);
    setProfile(p);
  }, [session?.user]);

  const updateProfile = useCallback(
    async (patch: Partial<Pick<UserProfile, 'nickname' | 'avatar_url' | 'balance' | 'card_last4' | 'card_brand' | 'card_holder' | 'card_expiry'>>) => {
      if (!session?.user) throw new Error('Необходима авторизация');
      const prev = profile;
      setProfile((p) => (p ? { ...p, ...patch } : p));
      const { error } = await supabase
        .from('users')
        .update(patch)
        .eq('id', session.user.id);
      if (error) {
        setProfile(prev);
        throw error;
      }
    },
    [session?.user, profile],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, profile, signIn, signUp, signOut, refreshProfile, updateProfile }),
    [status, session, profile, signIn, signUp, signOut, refreshProfile, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
