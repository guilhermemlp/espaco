/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Autenticação e preferências do Espaço.
 *
 * Padrão do produto: Supabase Auth + dados na nuvem por usuário.
 * O modo local existe apenas quando o Supabase NÃO está configurado
 * (VITE_ENABLE_SUPABASE="false" ou credenciais ausentes).
 *
 * Privacidade:
 * - O PIN é local e nunca é enviado para a nuvem.
 * - Ao sair de uma conta na nuvem, o cache local daquele usuário é
 *   removido do dispositivo (quando não há alterações pendentes).
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { Profile, UserPreferences, ConsentRecord } from '../types';
import { storageService, DEFAULT_PREFERENCES } from '../services/storage';
import type { SyncTable } from '../services/storage';
import { supabase, supabaseSync, isSupabaseConfigured } from '../services/supabase';
import { createId } from '../utils/id';

interface AuthResult {
  error?: string;
  message?: string;
}

interface AuthContextType {
  user: Profile | null;
  preferences: UserPreferences;
  onboardingCompleted: boolean;
  authLoading: boolean;
  isLocked: boolean;
  hasPin: boolean;
  isSupabaseReady: boolean;
  signInWithSupabase: (email: string, password: string) => Promise<AuthResult>;
  signUpWithSupabase: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  signInWithMagicLink: (email: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  isPasswordRecovery: boolean;
  dismissPasswordRecovery: () => void;
  logout: () => Promise<void>;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => void;
  completeOnboarding: (prefs?: Partial<UserPreferences>, consent?: ConsentRecord) => void;
  setPin: (pin: string | null) => void;
  unlockWithPin: (pin: string) => boolean;
  lockApp: () => void;
  loadDemoData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_ID = 'local';

const createLocalUser = (): Profile => ({
  id: LOCAL_USER_ID,
  email: 'local@espaco.app',
  displayName: 'Meu espaço local',
  createdAt: new Date().toISOString(),
});

function toProfile(supabaseUser: SupabaseUser): Profile {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    displayName:
      supabaseUser.user_metadata?.display_name ||
      supabaseUser.email?.split('@')[0] ||
      'Usuário',
    createdAt: supabaseUser.created_at,
  };
}

function cloneDefaultPreferences(): UserPreferences {
  return {
    ...DEFAULT_PREFERENCES,
    activeModules: { ...DEFAULT_PREFERENCES.activeModules },
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSupabaseReady = isSupabaseConfigured();
  const cloudAuth = isSupabaseReady && !!supabase;

  const [user, setUser] = useState<Profile | null>(() => {
    if (!cloudAuth) {
      storageService.setActiveUser(LOCAL_USER_ID);
      return createLocalUser();
    }
    return null;
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    if (!cloudAuth) return storageService.getPreferences();
    return cloneDefaultPreferences();
  });

  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    if (!cloudAuth) return storageService.isOnboardingCompleted();
    return false;
  });

  const [authLoading, setAuthLoading] = useState<boolean>(cloudAuth);

  // Verdadeiro quando o usuário chegou por um link de redefinição de senha.
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (!cloudAuth) return !!storageService.getPreferences().pinCode;
    return false;
  });

  // Aplica tema ao documento.
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [preferences.theme]);

  const enqueueOperation = useCallback(
    (table: SyncTable, entityId: string, entity: unknown) => {
      storageService.enqueueOutbox({
        id: createId(),
        table,
        type: 'upsert',
        entityId,
        entity,
        createdAt: new Date().toISOString(),
      });
    },
    [],
  );

  const persistPreferences = useCallback(
    (userId: string, prefs: UserPreferences) => {
      void supabaseSync
        .upsertPreferences(userId, prefs)
        .then((ok) => {
          if (!ok) enqueueOperation('user_preferences', userId, prefs);
        })
        .catch(() => enqueueOperation('user_preferences', userId, prefs));
    },
    [enqueueOperation],
  );

  const persistConsent = useCallback(
    (userId: string, consent: ConsentRecord) => {
      void supabaseSync
        .upsertConsent(userId, consent)
        .then((ok) => {
          if (!ok) enqueueOperation('consent_records', userId, consent);
        })
        .catch(() => enqueueOperation('consent_records', userId, consent));
    },
    [enqueueOperation],
  );

  const resetToSignedOut = useCallback(() => {
    storageService.setCurrentUser(null);
    storageService.setActiveUser(null);
    setUser(null);
    setPreferences(cloneDefaultPreferences());
    setOnboardingCompleted(false);
    setIsLocked(false);
    setIsPasswordRecovery(false);
  }, []);

  /**
   * Carrega o usuário e as preferências. A nuvem é a fonte da verdade,
   * mas o PIN e outros dados apenas locais permanecem no dispositivo.
   */
  const applySession = useCallback(
    async (session: Session | null) => {
      if (!cloudAuth || !session?.user) {
        resetToSignedOut();
        return;
      }

      const cloudUser = toProfile(session.user);

      // Define o namespace antes de qualquer leitura local.
      storageService.setActiveUser(cloudUser.id);

      const localPreferences = storageService.getPreferences();
      const cloudPreferences = await supabaseSync.fetchPreferences(cloudUser.id);

      const merged: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        ...localPreferences,
        ...(cloudPreferences || {}),
        activeModules: {
          ...DEFAULT_PREFERENCES.activeModules,
          ...localPreferences.activeModules,
          ...(cloudPreferences?.activeModules || {}),
        },
        // PIN nunca vem da nuvem.
        pinCode: localPreferences.pinCode ?? null,
      };

      const completed =
        cloudPreferences?.onboardingCompleted ?? storageService.isOnboardingCompleted();
      merged.onboardingCompleted = completed;

      storageService.setPreferences(merged);
      storageService.setOnboardingCompleted(completed);
      storageService.setCurrentUser(cloudUser);

      setUser(cloudUser);
      setPreferences(merged);
      setOnboardingCompleted(completed);
      setIsLocked(!!merged.pinCode);

      // Garante o perfil (idempotente).
      void supabaseSync.ensureProfile(cloudUser);
    },
    [cloudAuth, resetToSignedOut],
  );

  // Sincroniza o estado de autenticação do Supabase.
  useEffect(() => {
    if (!cloudAuth || !supabase) {
      setAuthLoading(false);
      return;
    }

    let cancelled = false;

    const complete = () => {
      if (!cancelled) setAuthLoading(false);
    };

    void supabase.auth
      .getSession()
      .then(({ data }) => applySession(data.session))
      .catch((error) => {
        console.warn('[auth] Falha ao restaurar a sessão.', error);
        resetToSignedOut();
      })
      .finally(complete);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // O usuário abriu um link de redefinição: pede a nova senha.
        setIsPasswordRecovery(true);
      }

      if (event === 'SIGNED_OUT') {
        resetToSignedOut();
        complete();
        return;
      }

      if (session) {
        void applySession(session).finally(complete);
      } else if (event === 'INITIAL_SESSION') {
        resetToSignedOut();
        complete();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [cloudAuth, applySession, resetToSignedOut]);

  /* ---------------------------------------------------------------------- */
  /* Autenticação                                                           */
  /* ---------------------------------------------------------------------- */

  const signInWithSupabase = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return { error: 'Supabase não está configurado neste ambiente.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) return { error: error.message };
    if (data.session) await applySession(data.session);
    return {};
  };

  const signUpWithSupabase = async (
    email: string,
    password: string,
    displayName?: string,
  ): Promise<AuthResult> => {
    if (!supabase) {
      return { error: 'Supabase não está configurado neste ambiente.' };
    }

    const cleanEmail = email.trim();
    const name = displayName?.trim() || cleanEmail.split('@')[0];

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) return { error: error.message };

    // Quando a confirmação de e-mail está ativa, ainda não há sessão.
    if (data.session) {
      await applySession(data.session);
      return {};
    }

    return {
      message:
        'Conta criada. Enviamos um link de confirmação para o seu e-mail; abra-o para entrar.',
    };
  };

  const signInWithMagicLink = async (email: string): Promise<AuthResult> => {
    if (!supabase) {
      return { error: 'Supabase não está configurado neste ambiente.' };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) return { error: error.message };
    return { message: 'Enviamos um link de acesso para o seu e-mail.' };
  };

  /**
   * Envia um e-mail de redefinição de senha.
   * A mensagem é neutra para não revelar se o e-mail tem conta.
   */
  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    if (!supabase) {
      return { error: 'Supabase não está configurado neste ambiente.' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });

    if (error) return { error: error.message };

    return {
      message:
        'Se existir uma conta com este e-mail, enviamos um link para redefinir a senha. Confira também o spam.',
    };
  };

  /** Remove os parâmetros do link de recuperação da barra de endereços. */
  const clearRecoveryUrlParams = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      url.hash = '';
      window.history.replaceState({}, '', url.pathname + url.search);
    } catch {
      // Sem History API: mantém a URL como está.
    }
  };

  const dismissPasswordRecovery = () => {
    setIsPasswordRecovery(false);
    clearRecoveryUrlParams();
  };

  /**
   * Define uma nova senha para a conta da sessão atual.
   * Funciona tanto no fluxo de recuperação quanto na troca pelo app.
   */
  const updatePassword = async (password: string): Promise<AuthResult> => {
    if (!supabase) {
      return { error: 'Supabase não está configurado neste ambiente.' };
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) return { error: error.message };

    setIsPasswordRecovery(false);
    clearRecoveryUrlParams();
    return { message: 'Senha atualizada com sucesso.' };
  };

  const logout = async () => {
    if (!cloudAuth || !supabase) return;

    const userId = user?.id;

    if (userId) {
      // Tenta enviar alterações pendentes antes de limpar o cache local.
      let flushed = true;
      const pending = storageService.getOutbox();
      for (const operation of pending) {
        try {
          const ok = await supabaseSync.applyOutbox(operation);
          if (!ok) {
            flushed = false;
            break;
          }
        } catch {
          flushed = false;
          break;
        }
      }

      if (flushed) {
        storageService.setOutbox([]);
        // Remove o cache local do usuário (dados de saúde não ficam no aparelho).
        storageService.setActiveUser(userId);
        storageService.wipeActiveUserData();
      } else {
        console.warn(
          '[auth] Sessão encerrada com alterações pendentes. O cache local foi mantido para não perder dados.',
        );
      }
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('[auth] Falha ao encerrar sessão no Supabase.', error);
    }

    storageService.setActiveUser(null);
    resetToSignedOut();
  };

  /* ---------------------------------------------------------------------- */
  /* Preferências e onboarding                                              */
  /* ---------------------------------------------------------------------- */

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    const updated: UserPreferences = {
      ...preferences,
      ...newPrefs,
      activeModules: {
        ...preferences.activeModules,
        ...(newPrefs.activeModules || {}),
      },
      // PIN só é alterado por setPin.
      pinCode: preferences.pinCode ?? null,
    };

    storageService.setPreferences(updated);
    setPreferences(updated);

    if (cloudAuth && user) {
      persistPreferences(user.id, updated);
    }
  };

  const completeOnboarding = (prefs?: Partial<UserPreferences>, consent?: ConsentRecord) => {
    const updated: UserPreferences = {
      ...preferences,
      ...prefs,
      activeModules: {
        ...preferences.activeModules,
        ...(prefs?.activeModules || {}),
      },
      pinCode: preferences.pinCode ?? null,
      onboardingCompleted: true,
    };

    storageService.setPreferences(updated);
    storageService.setOnboardingCompleted(true);
    setPreferences(updated);
    setOnboardingCompleted(true);

    if (consent) {
      storageService.setConsent(consent);
    }

    if (cloudAuth && user) {
      persistPreferences(user.id, updated);
      if (consent) persistConsent(user.id, consent);
    }
  };

  const setPin = (pin: string | null) => {
    const updated: UserPreferences = { ...preferences, pinCode: pin };
    storageService.setPreferences(updated);
    setPreferences(updated);
    if (!pin) setIsLocked(false);
  };

  const unlockWithPin = (pin: string): boolean => {
    if (preferences.pinCode && preferences.pinCode === pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (preferences.pinCode) setIsLocked(true);
  };

  /* ---------------------------------------------------------------------- */
  /* Dados de exemplo                                                       */
  /* ---------------------------------------------------------------------- */

  const loadDemoData = async () => {
    const activeUserId = user?.id || (cloudAuth ? null : LOCAL_USER_ID);
    if (!activeUserId) return;

    storageService.setActiveUser(activeUserId);
    const snapshot = storageService.seedSampleData(activeUserId);

    if (cloudAuth && user) {
      const pushes: Array<{ table: SyncTable; id: string; entity: unknown; run: () => Promise<boolean> }> = [
        ...snapshot.checkIns.map((entity) => ({
          table: 'check_ins' as SyncTable,
          id: entity.id,
          entity,
          run: () => supabaseSync.pushCheckIn(entity),
        })),
        ...snapshot.sleepEntries.map((entity) => ({
          table: 'sleep_entries' as SyncTable,
          id: entity.id,
          entity,
          run: () => supabaseSync.pushSleep(entity),
        })),
        ...snapshot.categories.map((entity) => ({
          table: 'behavior_categories' as SyncTable,
          id: entity.id,
          entity,
          run: () => supabaseSync.pushCategory(entity),
        })),
        ...snapshot.behaviorEntries.map((entity) => ({
          table: 'behavior_entries' as SyncTable,
          id: entity.id,
          entity,
          run: () => supabaseSync.pushBehavior(entity),
        })),
        ...snapshot.journalEntries.map((entity) => ({
          table: 'journal_entries' as SyncTable,
          id: entity.id,
          entity,
          run: () => supabaseSync.pushJournal(entity),
        })),
        ...snapshot.recoveryPeriods.map((entity) => ({
          table: 'recovery_periods' as SyncTable,
          id: entity.id,
          entity,
          run: () => supabaseSync.pushRecoveryPeriod(entity),
        })),
        ...snapshot.recoveryActivities.map((entity) => ({
          table: 'recovery_activities' as SyncTable,
          id: entity.id,
          entity,
          run: () => supabaseSync.pushRecoveryActivity(entity),
        })),
      ];

      await Promise.all(
        pushes.map(async ({ table, id, entity, run }) => {
          try {
            const ok = await run();
            if (!ok) enqueueOperation(table, id, entity);
          } catch {
            enqueueOperation(table, id, entity);
          }
        }),
      );
    }

    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        onboardingCompleted,
        authLoading,
        isLocked,
        hasPin: !!preferences.pinCode,
        isSupabaseReady,
        signInWithSupabase,
        signUpWithSupabase,
        signInWithMagicLink,
        requestPasswordReset,
        updatePassword,
        isPasswordRecovery,
        dismissPasswordRecovery,
        logout,
        updatePreferences,
        completeOnboarding,
        setPin,
        unlockWithPin,
        lockApp,
        loadDemoData,
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
