/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserPreferences, ConsentRecord } from '../types';
import { storageService, DEFAULT_PREFERENCES, seedSampleData } from '../services/storage';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  user: Profile | null;
  preferences: UserPreferences;
  onboardingCompleted: boolean;
  isLocked: boolean;
  hasPin: boolean;
  isSupabaseReady: boolean;
  loginAsGuest: () => void;
  loginWithEmail: (email: string, name?: string) => void;
  signInWithSupabase: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithSupabase: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>;
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => void;
  completeOnboarding: (prefs?: Partial<UserPreferences>, consent?: ConsentRecord) => void;
  setPin: (pin: string | null) => void;
  unlockWithPin: (pin: string) => boolean;
  lockApp: () => void;
  loadDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSupabaseReady = isSupabaseConfigured();

  const [user, setUser] = useState<Profile | null>(() => storageService.getCurrentUser());
  const [preferences, setPreferences] = useState<UserPreferences>(() => storageService.getPreferences());
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => storageService.isOnboardingCompleted());
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const prefs = storageService.getPreferences();
    return !!prefs.pinCode;
  });

  // Apply dark mode class to root document if selected
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [preferences.theme]);

  // Synchronize Supabase Auth state if configured
  useEffect(() => {
    if (!supabase) return;

    // Check existing Supabase session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const cloudUser: Profile = {
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Usuário',
          createdAt: session.user.created_at,
        };
        setUser(cloudUser);
        storageService.setCurrentUser(cloudUser);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const cloudUser: Profile = {
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Usuário',
          createdAt: session.user.created_at,
        };
        setUser(cloudUser);
        storageService.setCurrentUser(cloudUser);
      } else if (!storageService.getCurrentUser()) {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginAsGuest = () => {
    const guestUser: Profile = {
      id: 'local-guest',
      email: 'convidado@espaco.local',
      displayName: 'Visitante',
      createdAt: new Date().toISOString()
    };
    storageService.setCurrentUser(guestUser);
    setUser(guestUser);
  };

  const loginWithEmail = (email: string, name?: string) => {
    const cleanEmail = email.trim();
    const newUser: Profile = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      displayName: name?.trim() || cleanEmail.split('@')[0],
      createdAt: new Date().toISOString()
    };
    storageService.setCurrentUser(newUser);
    setUser(newUser);
  };

  const signInWithSupabase = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!supabase) {
      return { error: 'Supabase ainda não configurado nas variáveis de ambiente.' };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      return { error: error.message };
    }
    if (data.user) {
      const cloudUser: Profile = {
        id: data.user.id,
        email: data.user.email || '',
        displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'Usuário',
        createdAt: data.user.created_at,
      };
      setUser(cloudUser);
      storageService.setCurrentUser(cloudUser);
    }
    return {};
  };

  const signUpWithSupabase = async (email: string, password: string, displayName?: string): Promise<{ error?: string }> => {
    if (!supabase) {
      return { error: 'Supabase ainda não configurado nas variáveis de ambiente.' };
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName?.trim() || email.split('@')[0],
        },
      },
    });
    if (error) {
      return { error: error.message };
    }
    if (data.user) {
      const cloudUser: Profile = {
        id: data.user.id,
        email: data.user.email || '',
        displayName: displayName?.trim() || data.user.email?.split('@')[0] || 'Usuário',
        createdAt: data.user.created_at,
      };
      setUser(cloudUser);
      storageService.setCurrentUser(cloudUser);
    }
    return {};
  };

  const signInWithMagicLink = async (email: string): Promise<{ error?: string }> => {
    if (!supabase) {
      return { error: 'Supabase ainda não configurado nas variáveis de ambiente.' };
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      return { error: error.message };
    }
    return {};
  };

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Erro ao sair do Supabase:', err);
      }
    }
    storageService.setCurrentUser(null);
    setUser(null);
  };

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    storageService.setPreferences(updated);
    setPreferences(updated);
  };

  const completeOnboarding = (prefs?: Partial<UserPreferences>, consent?: ConsentRecord) => {
    if (prefs) {
      updatePreferences(prefs);
    }
    if (consent) {
      storageService.setConsent(consent);
    }
    if (!user) {
      loginAsGuest();
    }
    storageService.setOnboardingCompleted(true);
    setOnboardingCompleted(true);
  };

  const setPin = (pin: string | null) => {
    const updated = { ...preferences, pinCode: pin };
    storageService.setPreferences(updated);
    setPreferences(updated);
    if (!pin) {
      setIsLocked(false);
    }
  };

  const unlockWithPin = (pin: string): boolean => {
    if (preferences.pinCode && preferences.pinCode === pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (preferences.pinCode) {
      setIsLocked(true);
    }
  };

  const loadDemoData = () => {
    const activeUserId = user?.id || 'local-guest';
    seedSampleData(activeUserId);
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        onboardingCompleted,
        isLocked,
        hasPin: !!preferences.pinCode,
        isSupabaseReady,
        loginAsGuest,
        loginWithEmail,
        signInWithSupabase,
        signUpWithSupabase,
        signInWithMagicLink,
        logout,
        updatePreferences,
        completeOnboarding,
        setPin,
        unlockWithPin,
        lockApp,
        loadDemoData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
