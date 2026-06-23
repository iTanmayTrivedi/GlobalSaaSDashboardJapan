import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { MockUser, MOCK_USERS, getMockSession, setMockSession, clearMockSession, isSupabaseConfigured } from '@/lib/mock-auth';

export type AuthMode = 'demo' | 'supabase';

interface AuthContextType {
  // Common
  user: User | null;
  mockUser: MockUser | null;
  session: Session | null;
  loading: boolean;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  signOut: () => Promise<void>;
  // Supabase auth
  signUp: (email: string, password: string, displayName?: string, role?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  // Mock auth
  mockSignIn: (userId: string) => void;
  isAuthenticated: boolean;
  supabaseAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [mockUser, setMockUser] = useState<MockUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthModeState] = useState<AuthMode>(() => {
    return (localStorage.getItem('auth_mode') as AuthMode) || 'demo';
  });
  const [supabaseAvailable, setSupabaseAvailable] = useState(isSupabaseConfigured());

  const setAuthMode = useCallback((mode: AuthMode) => {
    localStorage.setItem('auth_mode', mode);
    setAuthModeState(mode);
  }, []);

  // Initialize mock session
  useEffect(() => {
    const stored = getMockSession();
    if (stored) setMockUser(stored);
  }, []);

  // Initialize Supabase session
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSupabaseAvailable(false);
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      clearTimeout(timeout);
      setSupabaseAvailable(false);
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string, role?: string) => {
    if (!isSupabaseConfigured()) return { error: { message: 'Supabase not configured' } };
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: displayName, timezone, selected_role: role || 'member' },
        },
      });
      return { error };
    } catch (err) {
      setSupabaseAvailable(false);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) return { error: { message: 'Supabase not configured' } };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setLoading(false);
      }
      return { error };
    } catch (err) {
      setSupabaseAvailable(false);
      return { error: err };
    }
  };

  const mockSignIn = (userId: string) => {
    const found = MOCK_USERS.find(u => u.id === userId);
    if (found) {
      setMockSession(found);
      setMockUser(found);
    }
  };

  const signOut = async () => {
    if (authMode === 'supabase' && isSupabaseConfigured()) {
      try { await supabase.auth.signOut(); } catch {}
    }
    clearMockSession();
    setMockUser(null);
    setUser(null);
    setSession(null);
  };

  const isAuthenticated = authMode === 'demo' ? !!mockUser : !!user;

  return (
    <AuthContext.Provider value={{
      user, mockUser, session, loading: authMode === 'supabase' ? loading : false,
      authMode, setAuthMode, signOut,
      signUp, signIn, mockSignIn,
      isAuthenticated, supabaseAvailable,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
