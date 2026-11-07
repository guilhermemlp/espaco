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
} from '../types';
import { storageService, createDefaultCategories } from '../services/storage';
import { supabaseSync, isSupabaseConfigured } from '../services/supabase';
import { useAuth } from './AuthContext';
import { createId } from '../utils/id';
import { daysBetween, parseLocalDate, todayLocalDate } from '../utils/date';
import type { SyncTable } from '../services/storage';

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
  addCategory: (name: string, description?: string) => BehaviorCategory;
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

  calculateRecoveryDays: (startDate: string, endDate?: string | null) => number;
  calculateFormattedDuration: (startDate: string) => string;
  getRecoveryMilestones: (period: RecoveryPeriod) => { days: number; title: string; achieved: boolean }[];

  reloadData: () => void;
  syncWithCloud: () => Promise<void>;
  pushLocalSnapshotToCloud: () => Promise<boolean>;
  wipeCloudData: () => Promise<boolean>;
  isSyncing: boolean;
  isCloud: boolean;
  syncError: string | null;
  lastSyncedAt: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSupabaseReady } = useAuth();
  const isCloud = isSupabaseReady && isSupabaseConfigured() && !!user && user.id !== 'local';
  const currentUserId = user?.id || 'local-guest';

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [categories, setCategories] = useState<BehaviorCategory[]>([]);
  const [behaviorEntries, setBehaviorEntries] = useState<BehaviorEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [recoveryPeriods, setRecoveryPeriods] = useState<RecoveryPeriod[]>([]);
  const [recoveryActivities, setRecoveryActivities] = useState<RecoveryActivity[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const reloadData = useCallback(() => {
    setCheckIns(storageService.getCheckIns());
    setSleepEntries(storageService.getSleepEntries());
    setCategories(storageService.getCategories());
    setBehaviorEntries(storageService.getBehaviorEntries());
    setJournalEntries(storageService.getJournalEntries());
    setRecoveryPeriods(storageService.getRecoveryPeriods());
    setRecoveryActivities(storageService.getRecoveryActivities());
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Fila de sincronização                                                  */
  /* ---------------------------------------------------------------------- */

  const enqueueOperation = useCallback(
    (table: SyncTable, type: 'upsert' | 'delete', entityId: string, entity?: unknown) => {
      storageService.enqueueOutbox({
        id: createId(),
        table,
        type,
        entityId,
        entity,
        rowId: type === 'delete' ? entityId : undefined,
        createdAt: new Date().toISOString(),
      });
    },
    [],
  );

  const pushUpsert = useCallback(
    (
      table: SyncTable,
      entityId: string,
      entity: unknown,
      action: () => Promise<boolean>,
    ) => {
      if (!isCloud) return;
      void action()
        .then((ok) => {
          if (!ok) enqueueOperation(table, 'upsert', entityId, entity);
        })
        .catch(() => enqueueOperation(table, 'upsert', entityId, entity));
    },
    [isCloud, enqueueOperation],
  );

  const pushDelete = useCallback(
    (table: SyncTable, entityId: string, action: () => Promise<boolean>) => {
      if (!isCloud) return;
      void action()
        .then((ok) => {
          if (!ok) enqueueOperation(table, 'delete', entityId);
        })
        .catch(() => enqueueOperation(table, 'delete', entityId));
    },
    [isCloud, enqueueOperation],
  );

  const flushOutbox = useCallback(async (): Promise<boolean> => {
    const pending = storageService.getOutbox();
    for (let index = 0; index < pending.length; index += 1) {
      const operation = pending[index];
      let ok = false;
      try {
        ok = await supabaseSync.applyOutbox(operation);
      } catch (error) {
        console.warn('[sync] Falha ao reaplicar operação pendente.', error);
        ok = false;
      }
      if (!ok) {
        storageService.setOutbox(pending.slice(index));
        return false;
      }
    }
    storageService.setOutbox([]);
    return true;
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Sincronização com a nuvem                                              */
  /* ---------------------------------------------------------------------- */

  const syncWithCloud = useCallback(async () => {
    if (!isCloud || !user) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const flushed = await flushOutbox();
      if (!flushed) {
        throw new Error('Existem alterações pendentes que não puderam ser enviadas. Tentaremos novamente.');
      }

      const snapshot = await supabaseSync.fetchAll(user.id);
      if (!snapshot) {
        throw new Error(
          'Não foi possível baixar seus dados agora. Se este é um projeto novo, execute supabase/schema.sql no Supabase.',
        );
      }

      let cloudCategories = snapshot.categories;
      if (cloudCategories.length === 0) {
        cloudCategories = createDefaultCategories(user.id);
        await Promise.all(
          cloudCategories.map(async (category) => {
            const ok = await supabaseSync.pushCategory(category);
            if (!ok) enqueueOperation('behavior_categories', 'upsert', category.id, category);
          }),
        );
      }

      storageService.replaceAllData({ ...snapshot, categories: cloudCategories });
      reloadData();
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha de sincronização.';
      setSyncError(message);
      console.warn('[sync]', message);
    } finally {
      setIsSyncing(false);
    }
  }, [isCloud, user, flushOutbox, reloadData, enqueueOperation]);

  /**
   * Envia o snapshot local atual para a nuvem, respeitando a ordem das
   * chaves estrangeiras (categorias → impulsos; períodos → atividades).
   * Usado após importar backup ou dados legados, antes de recarregar.
   */
  const pushLocalSnapshotToCloud = useCallback(async (): Promise<boolean> => {
    if (!isCloud || !user) return false;

    let allOk = true;

    const push = async (
      table: SyncTable,
      id: string,
      entity: unknown,
      run: () => Promise<boolean>,
    ) => {
      try {
        const ok = await run();
        if (!ok) {
          enqueueOperation(table, 'upsert', id, entity);
          allOk = false;
        }
      } catch {
        enqueueOperation(table, 'upsert', id, entity);
        allOk = false;
      }
    };

    const localCategories = storageService.getCategories();
    await Promise.all(
      localCategories.map((entity) =>
        push('behavior_categories', entity.id, entity, () => supabaseSync.pushCategory(entity)),
      ),
    );

    const localBehaviors = storageService.getBehaviorEntries();
    await Promise.all(
      localBehaviors.map((entity) =>
        push('behavior_entries', entity.id, entity, () => supabaseSync.pushBehavior(entity)),
      ),
    );

    const localPeriods = storageService.getRecoveryPeriods();
    await Promise.all(
      localPeriods.map((entity) =>
        push('recovery_periods', entity.id, entity, () => supabaseSync.pushRecoveryPeriod(entity)),
      ),
    );

    const localActivities = storageService.getRecoveryActivities();
    await Promise.all(
      localActivities.map((entity) =>
        push('recovery_activities', entity.id, entity, () =>
          supabaseSync.pushRecoveryActivity(entity),
        ),
      ),
    );

    const localCheckIns = storageService.getCheckIns();
    await Promise.all(
      localCheckIns.map((entity) =>
        push('check_ins', entity.id, entity, () => supabaseSync.pushCheckIn(entity)),
      ),
    );

    const localSleep = storageService.getSleepEntries();
    await Promise.all(
      localSleep.map((entity) =>
        push('sleep_entries', entity.id, entity, () => supabaseSync.pushSleep(entity)),
      ),
    );

    const localJournal = storageService.getJournalEntries();
    await Promise.all(
      localJournal.map((entity) =>
        push('journal_entries', entity.id, entity, () => supabaseSync.pushJournal(entity)),
      ),
    );

    const localPreferences = storageService.getPreferences();
    await push('user_preferences', user.id, localPreferences, () =>
      supabaseSync.upsertPreferences(user.id, localPreferences),
    );

    return allOk;
  }, [isCloud, user, enqueueOperation]);

  const wipeCloudData = useCallback(async (): Promise<boolean> => {
    if (!isCloud || !user) return true;
    return supabaseSync.deleteAllUserData(user.id);
  }, [isCloud, user]);

  /* ---------------------------------------------------------------------- */
  /* Ciclo de vida                                                          */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    storageService.setActiveUser(isSupabaseReady ? user?.id ?? null : 'local');
    reloadData();

    if (!isCloud) {
      if (storageService.getCategories().length === 0) {
        createDefaultCategories(currentUserId).forEach((category) =>
          storageService.saveCategory(category),
        );
        reloadData();
      }
      return;
    }

    void syncWithCloud();
  }, [user?.id, isSupabaseReady, isCloud, currentUserId, reloadData, syncWithCloud]);

  /* ---------------------------------------------------------------------- */
  /* Helpers de "hoje"                                                      */
  /* ---------------------------------------------------------------------- */

  const todayDateStr = todayLocalDate();
  const todayCheckIn = checkIns.find((item) => item.date === todayDateStr) || null;
  const todaySleepEntry = sleepEntries.find((item) => item.date === todayDateStr) || null;
  const activeRecoveryPeriod = recoveryPeriods.find((item) => item.isActive) || null;

  /* ---------------------------------------------------------------------- */
  /* Check-ins                                                              */
  /* ---------------------------------------------------------------------- */

  const saveCheckIn = (
    data: Omit<CheckIn, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    existingId?: string,
  ) => {
    const now = new Date().toISOString();
    const existing = existingId ? checkIns.find((item) => item.id === existingId) : todayCheckIn;

    const entry: CheckIn = {
      ...data,
      id: existingId || existing?.id || createId(),
      userId: currentUserId,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const updated = storageService.saveCheckIn(entry);
    setCheckIns(updated);
    pushUpsert('check_ins', entry.id, entry, () => supabaseSync.pushCheckIn(entry));
  };

  const deleteCheckIn = (id: string) => {
    const updated = storageService.deleteCheckIn(id);
    setCheckIns(updated);
    pushDelete('check_ins', id, () => supabaseSync.deleteCheckIn(id));
  };

  /* ---------------------------------------------------------------------- */
  /* Sono                                                                   */
  /* ---------------------------------------------------------------------- */

  const saveSleepEntry = (
    data: Omit<SleepEntry, 'id' | 'userId' | 'createdAt'>,
    existingId?: string,
  ) => {
    const now = new Date().toISOString();
    const existing = existingId ? sleepEntries.find((item) => item.id === existingId) : todaySleepEntry;

    const entry: SleepEntry = {
      ...data,
      id: existingId || existing?.id || createId(),
      userId: currentUserId,
      createdAt: existing?.createdAt || now,
    };

    const updated = storageService.saveSleepEntry(entry);
    setSleepEntries(updated);
    pushUpsert('sleep_entries', entry.id, entry, () => supabaseSync.pushSleep(entry));
  };

  const deleteSleepEntry = (id: string) => {
    const updated = storageService.deleteSleepEntry(id);
    setSleepEntries(updated);
    pushDelete('sleep_entries', id, () => supabaseSync.deleteSleep(id));
  };

  /* ---------------------------------------------------------------------- */
  /* Categorias                                                             */
  /* ---------------------------------------------------------------------- */

  const addCategory = (name: string, description?: string): BehaviorCategory => {
    const category: BehaviorCategory = {
      id: createId(),
      userId: currentUserId,
      name: name.trim(),
      description: description?.trim(),
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    const updated = storageService.saveCategory(category);
    setCategories(updated);
    pushUpsert('behavior_categories', category.id, category, () =>
      supabaseSync.pushCategory(category),
    );
    return category;
  };

  const deleteCategory = (id: string) => {
    const updatedCategories = storageService.deleteCategory(id);
    const updatedBehaviors = storageService.deleteBehaviorEntriesByCategory(id);
    setCategories(updatedCategories);
    setBehaviorEntries(updatedBehaviors);
    pushDelete('behavior_categories', id, () => supabaseSync.deleteCategory(id));
  };

  /* ---------------------------------------------------------------------- */
  /* Impulsos                                                               */
  /* ---------------------------------------------------------------------- */

  const saveBehaviorEntry = (
    data: Omit<BehaviorEntry, 'id' | 'userId' | 'createdAt'>,
    existingId?: string,
  ) => {
    const now = new Date().toISOString();
    const existing = existingId ? behaviorEntries.find((item) => item.id === existingId) : null;

    const entry: BehaviorEntry = {
      ...data,
      id: existingId || existing?.id || createId(),
      userId: currentUserId,
      createdAt: existing?.createdAt || now,
    };

    const updated = storageService.saveBehaviorEntry(entry);
    setBehaviorEntries(updated);
    pushUpsert('behavior_entries', entry.id, entry, () => supabaseSync.pushBehavior(entry));
  };

  const deleteBehaviorEntry = (id: string) => {
    const updated = storageService.deleteBehaviorEntry(id);
    setBehaviorEntries(updated);
    pushDelete('behavior_entries', id, () => supabaseSync.deleteBehavior(id));
  };

  /* ---------------------------------------------------------------------- */
  /* Diário                                                                 */
  /* ---------------------------------------------------------------------- */

  const saveJournalEntry = (
    data: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    existingId?: string,
  ) => {
    const now = new Date().toISOString();
    const existing = existingId ? journalEntries.find((item) => item.id === existingId) : null;

    const entry: JournalEntry = {
      ...data,
      id: existingId || existing?.id || createId(),
      userId: currentUserId,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const updated = storageService.saveJournalEntry(entry);
    setJournalEntries(updated);
    pushUpsert('journal_entries', entry.id, entry, () => supabaseSync.pushJournal(entry));
  };

  const deleteJournalEntry = (id: string) => {
    const updated = storageService.deleteJournalEntry(id);
    setJournalEntries(updated);
    pushDelete('journal_entries', id, () => supabaseSync.deleteJournal(id));
  };

  /* ---------------------------------------------------------------------- */
  /* Recuperação                                                            */
  /* ---------------------------------------------------------------------- */

  const saveRecoveryPeriod = (label: string, startDate: string, notes?: string) => {
    const period: RecoveryPeriod = {
      id: createId(),
      userId: currentUserId,
      label: label.trim() || 'Minha jornada',
      startDate,
      isActive: true,
      notes,
      createdAt: new Date().toISOString(),
    };

    const updated = storageService.saveRecoveryPeriod(period);
    setRecoveryPeriods(updated);

    // Sincroniza o novo ciclo e o encerramento gentil dos anteriores.
    updated.forEach((item) => {
      pushUpsert('recovery_periods', item.id, item, () => supabaseSync.pushRecoveryPeriod(item));
    });
  };

  const restartRecoveryPeriod = (newLabel: string, newStartDate: string, notes?: string) => {
    saveRecoveryPeriod(newLabel, newStartDate, notes);
  };

  const saveRecoveryActivity = (data: Omit<RecoveryActivity, 'id' | 'userId' | 'createdAt'>) => {
    const activity: RecoveryActivity = {
      ...data,
      id: createId(),
      userId: currentUserId,
      createdAt: new Date().toISOString(),
    };

    const updated = storageService.saveRecoveryActivity(activity);
    setRecoveryActivities(updated);
    pushUpsert('recovery_activities', activity.id, activity, () =>
      supabaseSync.pushRecoveryActivity(activity),
    );
  };

  const deleteRecoveryActivity = (id: string) => {
    const updated = storageService.deleteRecoveryActivity(id);
    setRecoveryActivities(updated);
    pushDelete('recovery_activities', id, () => supabaseSync.deleteRecoveryActivity(id));
  };

  /* ---------------------------------------------------------------------- */
  /* Cálculos                                                               */
  /* ---------------------------------------------------------------------- */

  const calculateRecoveryDays = (startDate: string, endDate?: string | null): number => {
    if (!startDate) return 0;
    return daysBetween(startDate, endDate || todayLocalDate());
  };

  const calculateFormattedDuration = (startDate: string): string => {
    if (!startDate) return '0 dias';

    const start = parseLocalDate(startDate);
    const today = parseLocalDate(todayLocalDate());
    if (Number.isNaN(start.getTime())) return '0 dias';

    let years = today.getFullYear() - start.getFullYear();
    let months = today.getMonth() - start.getMonth();
    let days = today.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += previousMonth.getDate();
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
    const days = calculateRecoveryDays(period.startDate, period.endDate || undefined);
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

    return milestoneSteps.map((milestone) => ({
      ...milestone,
      achieved: days >= milestone.days,
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
        pushLocalSnapshotToCloud,
        wipeCloudData,
        isSyncing,
        isCloud,
        syncError,
        lastSyncedAt,
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
