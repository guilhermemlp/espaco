/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserPreferences, ConsentRecord } from '../types';
import { storageService, DEFAULT_PREFERENCES, seedSampleData } from '../services/storage';

interface AuthContextType {
  user: Profile | null;
  preferences: UserPreferences;
  onboardingCompleted: boolean;
  isLocked: boolean;
  hasPin: boolean;
  loginAsGuest: () => void;
  loginWithEmail: (email: string, name?: string) => void;
  logout: () => void;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => void;
  completeOnboarding: (prefs?: Partial<UserPreferences>, consent?: ConsentRecord) => void;
  setPin: (pin: string | null) => void;
  unlockWithPin: (pin: string) => boolean;
  lockApp: () => void;
  loadDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const logout = () => {
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
    // Reload state after seeding
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
        loginAsGuest,
        loginWithEmail,
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
