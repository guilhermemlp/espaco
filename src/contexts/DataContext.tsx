/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  CheckIn, 
  SleepEntry, 
  BehaviorCategory, 
  BehaviorEntry, 
  JournalEntry, 
  RecoveryPeriod, 
  RecoveryActivity, 
  RecoveryMilestone 
} from '../types';
import { storageService } from '../services/storage';
import { supabaseSync, isSupabaseConfigured } from '../services/supabase';
import { useAuth } from './AuthContext';

interface DataContextType {
  checkIns: CheckIn[];
  todayCheckIn: CheckIn | null;
  saveCheckIn: (data: Omit<CheckIn, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  deleteCheckIn: (id: string) => void;

  sleepEntries: SleepEntry[];
  todaySleepEntry: SleepEntry | null;
  saveSleepEntry: (data: Omit<SleepEntry, 'id' | 'userId' | 'createdAt'>, id?: string) => void;
  deleteSleepEntry: (id: string) => void;

  categories: BehaviorCategory[];
  addCategory: (name: string, description?: string) => void;
  deleteCategory: (id: string) => void;

  behaviorEntries: BehaviorEntry[];
  saveBehaviorEntry: (data: Omit<BehaviorEntry, 'id' | 'userId' | 'createdAt'>, id?: string) => void;
  deleteBehaviorEntry: (id: string) => void;

  journalEntries: JournalEntry[];
  saveJournalEntry: (data: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  deleteJournalEntry: (id: string) => void;

  recoveryPeriods: RecoveryPeriod[];
  activeRecoveryPeriod: RecoveryPeriod | null;
  saveRecoveryPeriod: (label: string, startDate: string, notes?: string) => void;
  restartRecoveryPeriod: (newLabel: string, newStartDate: string, notes?: string) => void;

  recoveryActivities: RecoveryActivity[];
  saveRecoveryActivity: (data: Omit<RecoveryActivity, 'id' | 'userId' | 'createdAt'>) => void;
  deleteRecoveryActivity: (id: string) => void;

  calculateRecoveryDays: (startDate: string) => number;
  calculateFormattedDuration: (startDate: string) => string;
  getRecoveryMilestones: (period: RecoveryPeriod) => { days: number; title: string; achieved: boolean }[];
  reloadData: () => void;
  syncWithCloud: () => Promise<void>;
  isSyncing: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'local-guest';

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [categories, setCategories] = useState<BehaviorCategory[]>([]);
  const [behaviorEntries, setBehaviorEntries] = useState<BehaviorEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [recoveryPeriods, setRecoveryPeriods] = useState<RecoveryPeriod[]>([]);
  const [recoveryActivities, setRecoveryActivities] = useState<RecoveryActivity[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const reloadData = useCallback(() => {
    setCheckIns(storageService.getCheckIns());
    setSleepEntries(storageService.getSleepEntries());
    setCategories(storageService.getCategories());
    setBehaviorEntries(storageService.getBehaviorEntries());
    setJournalEntries(storageService.getJournalEntries());
    setRecoveryPeriods(storageService.getRecoveryPeriods());
    setRecoveryActivities(storageService.getRecoveryActivities());
  }, []);

  // Sync with Supabase if active
  const syncWithCloud = useCallback(async () => {
    if (!isSupabaseConfigured() || !user || user.id === 'local-guest') return;

    try {
      setIsSyncing(true);
      const [
        cloudCheckIns,
        cloudSleep,
        cloudCategories,
        cloudBehaviors,
        cloudJournal,
        cloudRecovery,
      ] = await Promise.all([
        supabaseSync.fetchCheckIns(),
        supabaseSync.fetchSleep(),
        supabaseSync.fetchCategories(),
        supabaseSync.fetchBehaviors(),
        supabaseSync.fetchJournal(),
        supabaseSync.fetchRecoveryPeriods(),
      ]);

      if (cloudCheckIns && cloudCheckIns.length > 0) {
        localStorage.setItem('espaco_check_ins', JSON.stringify(cloudCheckIns));
        setCheckIns(cloudCheckIns);
      }
      if (cloudSleep && cloudSleep.length > 0) {
        localStorage.setItem('espaco_sleep_entries', JSON.stringify(cloudSleep));
        setSleepEntries(cloudSleep);
      }
      if (cloudCategories && cloudCategories.length > 0) {
        localStorage.setItem('espaco_behavior_categories', JSON.stringify(cloudCategories));
        setCategories(cloudCategories);
      }
      if (cloudBehaviors && cloudBehaviors.length > 0) {
        localStorage.setItem('espaco_behavior_entries', JSON.stringify(cloudBehaviors));
        setBehaviorEntries(cloudBehaviors);
      }
      if (cloudJournal && cloudJournal.length > 0) {
        localStorage.setItem('espaco_journal_entries', JSON.stringify(cloudJournal));
        setJournalEntries(cloudJournal);
      }
      if (cloudRecovery && cloudRecovery.length > 0) {
        localStorage.setItem('espaco_recovery_periods', JSON.stringify(cloudRecovery));
        setRecoveryPeriods(cloudRecovery);
      }
    } catch (err) {
      console.warn('Erro ao sincronizar com Supabase:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    reloadData();
    syncWithCloud();
  }, [user, reloadData, syncWithCloud]);

  // Today helpers
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayCheckIn = checkIns.find(c => c.date === todayDateStr) || null;
  const todaySleepEntry = sleepEntries.find(s => s.date === todayDateStr) || null;
  const activeRecoveryPeriod = recoveryPeriods.find(p => p.isActive) || null;

  // CheckIn operations
  const saveCheckIn = (
    data: Omit<CheckIn, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    const entry: CheckIn = {
      ...data,
      id: existingId || todayCheckIn?.id || 'chk-' + Date.now(),
      userId: currentUserId,
      createdAt: existingId ? (todayCheckIn?.createdAt || now) : now,
      updatedAt: now,
    };
    const updated = storageService.saveCheckIn(entry);
    setCheckIns(updated);

    // Background cloud sync
    if (isSupabaseConfigured() && user && user.id !== 'local-guest') {
      supabaseSync.upsertCheckIn(entry);
    }
  };

  const deleteCheckIn = (id: string) => {
    const updated = storageService.deleteCheckIn(id);
    setCheckIns(updated);

    if (isSupabaseConfigured() && user && user.id !== 'local-guest') {
      supabaseSync.deleteCheckIn(id);
    }
  };

  // Sleep operations
  const saveSleepEntry = (
    data: Omit<SleepEntry, 'id' | 'userId' | 'createdAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    const entry: SleepEntry = {
      ...data,
      id: existingId || todaySleepEntry?.id || 'slp-' + Date.now(),
      userId: currentUserId,
      createdAt: now,
    };
    const updated = storageService.saveSleepEntry(entry);
    setSleepEntries(updated);

    if (isSupabaseConfigured() && user && user.id !== 'local-guest') {
      supabaseSync.upsertSleep(entry);
    }
  };

  const deleteSleepEntry = (id: string) => {
    const updated = storageService.deleteSleepEntry(id);
    setSleepEntries(updated);
  };

  // Category operations
  const addCategory = (name: string, description?: string) => {
    const newCat: BehaviorCategory = {
      id: 'cat-' + Date.now(),
      userId: currentUserId,
      name: name.trim(),
      description: description?.trim(),
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    const updated = storageService.saveCategory(newCat);
    setCategories(updated);
  };

  const deleteCategory = (id: string) => {
    const updated = storageService.deleteCategory(id);
    setCategories(updated);
  };

  // Behavior operations
  const saveBehaviorEntry = (
    data: Omit<BehaviorEntry, 'id' | 'userId' | 'createdAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    const entry: BehaviorEntry = {
      ...data,
      id: existingId || 'beh-' + Date.now(),
      userId: currentUserId,
      createdAt: now,
    };
    const updated = storageService.saveBehaviorEntry(entry);
    setBehaviorEntries(updated);

    if (isSupabaseConfigured() && user && user.id !== 'local-guest') {
      supabaseSync.upsertBehavior(entry);
    }
  };

  const deleteBehaviorEntry = (id: string) => {
    const updated = storageService.deleteBehaviorEntry(id);
    setBehaviorEntries(updated);
  };

  // Journal operations
  const saveJournalEntry = (
    data: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    const existing = existingId ? journalEntries.find(j => j.id === existingId) : null;
    const entry: JournalEntry = {
      ...data,
      id: existingId || 'jrn-' + Date.now(),
      userId: currentUserId,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
    const updated = storageService.saveJournalEntry(entry);
    setJournalEntries(updated);

    if (isSupabaseConfigured() && user && user.id !== 'local-guest') {
      supabaseSync.upsertJournal(entry);
    }
  };

  const deleteJournalEntry = (id: string) => {
    const updated = storageService.deleteJournalEntry(id);
    setJournalEntries(updated);

    if (isSupabaseConfigured() && user && user.id !== 'local-guest') {
      supabaseSync.deleteJournal(id);
    }
  };

  // Recovery operations
  const saveRecoveryPeriod = (label: string, startDate: string, notes?: string) => {
    const now = new Date().toISOString();
    const newPeriod: RecoveryPeriod = {
      id: 'rec-' + Date.now(),
      userId: currentUserId,
      label: label.trim() || 'Minha jornada',
      startDate,
      isActive: true,
      notes,
      createdAt: now,
    };
    const updated = storageService.saveRecoveryPeriod(newPeriod);
    setRecoveryPeriods(updated);

    if (isSupabaseConfigured() && user && user.id !== 'local-guest') {
      supabaseSync.upsertRecoveryPeriod(newPeriod);
    }
  };

  // Gentle restart that preserves history with total neutrality
  const restartRecoveryPeriod = (newLabel: string, newStartDate: string, notes?: string) => {
    saveRecoveryPeriod(newLabel, newStartDate, notes);
  };

  const saveRecoveryActivity = (data: Omit<RecoveryActivity, 'id' | 'userId' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const entry: RecoveryActivity = {
      ...data,
      id: 'act-' + Date.now(),
      userId: currentUserId,
      createdAt: now,
    };
    const updated = storageService.saveRecoveryActivity(entry);
    setRecoveryActivities(updated);
  };

  const deleteRecoveryActivity = (id: string) => {
    const updated = storageService.deleteRecoveryActivity(id);
    setRecoveryActivities(updated);
  };

  // Helpers
  const calculateRecoveryDays = (startDate: string): number => {
    if (!startDate) return 0;
    const start = new Date(startDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - start.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const calculateFormattedDuration = (startDate: string): string => {
    if (!startDate) return '0 dias';
    const start = new Date(startDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let years = today.getFullYear() - start.getFullYear();
    let months = today.getMonth() - start.getMonth();
    let days = today.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
    if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`);

    return parts.join(', ');
  };

  const getRecoveryMilestones = (period: RecoveryPeriod) => {
    const days = calculateRecoveryDays(period.startDate);
    const milestoneSteps = [
      { days: 1, title: '24 horas de presença' },
      { days: 7, title: '1 semana' },
      { days: 14, title: '2 semanas' },
      { days: 30, title: '1 mês (30 dias)' },
      { days: 60, title: '2 meses (60 dias)' },
      { days: 90, title: '3 meses (90 dias)' },
      { days: 180, title: '6 meses (180 dias)' },
      { days: 270, title: '9 meses' },
      { days: 365, title: '1 ano de jornada' },
      { days: 500, title: '500 dias' },
      { days: 730, title: '2 anos' },
    ];

    return milestoneSteps.map(m => ({
      ...m,
      achieved: days >= m.days,
    }));
  };

  return (
    <DataContext.Provider
      value={{
        checkIns,
        todayCheckIn,
        saveCheckIn,
        deleteCheckIn,
        sleepEntries,
        todaySleepEntry,
        saveSleepEntry,
        deleteSleepEntry,
        categories,
        addCategory,
        deleteCategory,
        behaviorEntries,
        saveBehaviorEntry,
        deleteBehaviorEntry,
        journalEntries,
        saveJournalEntry,
        deleteJournalEntry,
        recoveryPeriods,
        activeRecoveryPeriod,
        saveRecoveryPeriod,
        restartRecoveryPeriod,
        recoveryActivities,
        saveRecoveryActivity,
        deleteRecoveryActivity,
        calculateRecoveryDays,
        calculateFormattedDuration,
        getRecoveryMilestones,
        reloadData,
        syncWithCloud,
        isSyncing,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
