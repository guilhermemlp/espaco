/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Integração com o Supabase (Auth + PostgreSQL + Row Level Security).
 *
 * Regras:
 * - A nuvem é a fonte da verdade para dados do usuário.
 * - Todas as linhas usam UUID compatível com o schema.
 * - O PIN e qualquer dado apenas local NUNCA são enviados.
 * - Operações que falham entram numa fila local (outbox) e são reaplicadas.
 */

import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import {
  Profile,
  CheckIn,
  SleepEntry,
  BehaviorCategory,
  BehaviorEntry,
  JournalEntry,
  RecoveryPeriod,
  RecoveryActivity,
  UserPreferences,
  ConsentRecord,
} from '../types';
import type { SyncOutboxOp, SyncTable } from './storage';

// =========================================================================
// TAG DE CONTROLE SUPABASE
// - Padrão: true (login e dados na nuvem).
// - Defina VITE_ENABLE_SUPABASE="false" para operar 100% local.
// =========================================================================
const rawEnableFlag = import.meta.env.VITE_ENABLE_SUPABASE;
export const ENABLE_SUPABASE: boolean =
  rawEnableFlag === undefined ? true : rawEnableFlag !== 'false';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  if (!ENABLE_SUPABASE) return false;

  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('sua-url-supabase') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 20 &&
    !supabaseAnonKey.includes('sua-chave-anon')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;

/* -------------------------------------------------------------------------- */
/* Mapeamento domínio <-> banco                                                */
/* -------------------------------------------------------------------------- */

type Row = Record<string, unknown>;

const checkInRow = (entry: CheckIn): Row => ({
  id: entry.id,
  user_id: entry.userId,
  date: entry.date,
  time: entry.time,
  mood: entry.mood,
  energy: entry.energy ?? null,
  anxiety: entry.anxiety ?? null,
  emotions: entry.emotions,
  note: entry.note ?? null,
  updated_at: new Date().toISOString(),
});

const sleepRow = (entry: SleepEntry): Row => ({
  id: entry.id,
  user_id: entry.userId,
  date: entry.date,
  duration_minutes: entry.durationMinutes,
  perceived_quality: entry.perceivedQuality,
  bedtime: entry.bedtime ?? null,
  wake_time: entry.wakeTime ?? null,
  notes: entry.notes ?? null,
  updated_at: new Date().toISOString(),
});

const categoryRow = (entry: BehaviorCategory): Row => ({
  id: entry.id,
  user_id: entry.userId,
  name: entry.name,
  description: entry.description ?? null,
  is_custom: entry.isCustom,
  updated_at: new Date().toISOString(),
});

const behaviorRow = (entry: BehaviorEntry): Row => ({
  id: entry.id,
  user_id: entry.userId,
  category_id: entry.categoryId,
  date: entry.date,
  time: entry.time,
  urge_intensity: entry.urgeIntensity,
  behavior_occurrence: entry.behaviorOccurrence,
  perceived_control: entry.perceivedControl,
  triggers: entry.triggers ?? null,
  consequences: entry.consequences ?? null,
  notes: entry.notes ?? null,
  updated_at: new Date().toISOString(),
});

const journalRow = (entry: JournalEntry): Row => ({
  id: entry.id,
  user_id: entry.userId,
  date: entry.date,
  time: entry.time,
  title: entry.title ?? null,
  content: entry.content,
  tag: entry.tag || 'livre',
  updated_at: new Date().toISOString(),
});

const periodRow = (entry: RecoveryPeriod): Row => ({
  id: entry.id,
  user_id: entry.userId,
  label: entry.label,
  start_date: entry.startDate,
  end_date: entry.endDate ?? null,
  is_active: entry.isActive,
  notes: entry.notes ?? null,
  updated_at: new Date().toISOString(),
});

const activityRow = (entry: RecoveryActivity): Row => ({
  id: entry.id,
  user_id: entry.userId,
  period_id: entry.periodId,
  type: entry.type,
  title: entry.title,
  notes: entry.notes ?? null,
  date: entry.date,
  updated_at: new Date().toISOString(),
});

const preferencesRow = (userId: string, prefs: UserPreferences): Row => ({
  user_id: userId,
  timezone: prefs.timezone,
  active_modules: prefs.activeModules,
  notifications_enabled: prefs.notificationsEnabled,
  notification_time: prefs.notificationTime ?? '20:00',
  privacy_blur_enabled: prefs.privacyBlurEnabled,
  theme: prefs.theme,
  onboarding_completed: prefs.onboardingCompleted === true,
  updated_at: new Date().toISOString(),
  // pinCode nunca é enviado.
});

const consentRow = (userId: string, consent: ConsentRecord): Row => ({
  user_id: userId,
  accepted_terms: consent.acceptedTerms,
  accepted_privacy: consent.acceptedPrivacy,
  accepted_at: consent.acceptedAt,
});

/* -------------------------------------------------------------------------- */
/* Leitura                                                                     */
/* -------------------------------------------------------------------------- */

async function selectRows(table: SyncTable, userId: string): Promise<Row[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.warn(`[supabase] Falha ao ler ${table}:`, error.message);
    return null;
  }

  return (data || []) as Row[];
}

const toCheckIn = (row: Row): CheckIn => ({
  id: String(row.id),
  userId: String(row.user_id),
  date: String(row.date),
  time: String(row.time),
  mood: Number(row.mood) as CheckIn['mood'],
  energy: row.energy == null ? null : (Number(row.energy) as CheckIn['energy']),
  anxiety: row.anxiety == null ? null : (Number(row.anxiety) as CheckIn['anxiety']),
  emotions: Array.isArray(row.emotions) ? (row.emotions as string[]) : [],
  note: row.note == null ? undefined : String(row.note),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
});

const toSleep = (row: Row): SleepEntry => ({
  id: String(row.id),
  userId: String(row.user_id),
  date: String(row.date),
  durationMinutes: Number(row.duration_minutes),
  perceivedQuality: Number(row.perceived_quality) as SleepEntry['perceivedQuality'],
  bedtime: row.bedtime == null ? undefined : String(row.bedtime),
  wakeTime: row.wake_time == null ? undefined : String(row.wake_time),
  notes: row.notes == null ? undefined : String(row.notes),
  createdAt: String(row.created_at),
});

const toCategory = (row: Row): BehaviorCategory => ({
  id: String(row.id),
  userId: String(row.user_id),
  name: String(row.name),
  description: row.description == null ? undefined : String(row.description),
  isCustom: row.is_custom === true,
  createdAt: String(row.created_at),
});

const toBehavior = (row: Row): BehaviorEntry => ({
  id: String(row.id),
  userId: String(row.user_id),
  categoryId: String(row.category_id),
  date: String(row.date),
  time: String(row.time),
  urgeIntensity: Number(row.urge_intensity),
  behaviorOccurrence: row.behavior_occurrence as BehaviorEntry['behaviorOccurrence'],
  perceivedControl: row.perceived_control as BehaviorEntry['perceivedControl'],
  triggers: row.triggers == null ? undefined : String(row.triggers),
  consequences: row.consequences == null ? undefined : String(row.consequences),
  notes: row.notes == null ? undefined : String(row.notes),
  createdAt: String(row.created_at),
});

const toJournal = (row: Row): JournalEntry => ({
  id: String(row.id),
  userId: String(row.user_id),
  date: String(row.date),
  time: String(row.time),
  title: row.title == null ? undefined : String(row.title),
  content: String(row.content),
  tag: row.tag == null ? 'livre' : String(row.tag),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
});

const toPeriod = (row: Row): RecoveryPeriod => ({
  id: String(row.id),
  userId: String(row.user_id),
  label: String(row.label),
  startDate: String(row.start_date),
  endDate: row.end_date == null ? null : String(row.end_date),
  isActive: row.is_active === true,
  notes: row.notes == null ? undefined : String(row.notes),
  createdAt: String(row.created_at),
});

const toActivity = (row: Row): RecoveryActivity => ({
  id: String(row.id),
  userId: String(row.user_id),
  periodId: String(row.period_id),
  type: row.type as RecoveryActivity['type'],
  title: String(row.title),
  notes: row.notes == null ? undefined : String(row.notes),
  date: String(row.date),
  createdAt: String(row.created_at),
});

const toPreferences = (row: Row): UserPreferences => ({
  timezone: String(row.timezone || 'America/Sao_Paulo'),
  activeModules: (row.active_modules || {}) as UserPreferences['activeModules'],
  notificationsEnabled: row.notifications_enabled === true,
  notificationTime: row.notification_time == null ? '20:00' : String(row.notification_time),
  pinCode: null,
  privacyBlurEnabled: row.privacy_blur_enabled === true,
  theme: (row.theme as UserPreferences['theme']) || 'light',
  onboardingCompleted: row.onboarding_completed === true,
});

export interface CloudSnapshot {
  checkIns: CheckIn[];
  sleepEntries: SleepEntry[];
  categories: BehaviorCategory[];
  behaviorEntries: BehaviorEntry[];
  journalEntries: JournalEntry[];
  recoveryPeriods: RecoveryPeriod[];
  recoveryActivities: RecoveryActivity[];
}

/* -------------------------------------------------------------------------- */
/* Escrita                                                                     */
/* -------------------------------------------------------------------------- */

async function upsertRow(table: SyncTable, row: Row, onConflict: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from(table).upsert(row, { onConflict });
  if (error) {
    console.warn(`[supabase] Falha ao salvar em ${table}:`, error.message);
    return false;
  }
  return true;
}

async function deleteRow(table: SyncTable, id: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.warn(`[supabase] Falha ao excluir de ${table}:`, error.message);
    return false;
  }
  return true;
}

/* -------------------------------------------------------------------------- */
/* API pública                                                                 */
/* -------------------------------------------------------------------------- */

export const supabaseSync = {
  /* ------------------------------ Auth/profile --------------------------- */

  async ensureProfile(user: Profile): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email,
        display_name: user.displayName,
      },
      { onConflict: 'id' },
    );

    if (error) {
      console.warn('[supabase] Falha ao garantir perfil:', error.message);
      return false;
    }
    return true;
  },

  async fetchPreferences(userId: string): Promise<UserPreferences | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[supabase] Falha ao ler preferências:', error.message);
      return null;
    }
    if (!data) return null;

    return toPreferences(data as Row);
  },

  async upsertPreferences(userId: string, prefs: UserPreferences): Promise<boolean> {
    return upsertRow('user_preferences', preferencesRow(userId, prefs), 'user_id');
  },

  async upsertConsent(userId: string, consent: ConsentRecord): Promise<boolean> {
    return upsertRow('consent_records', consentRow(userId, consent), 'user_id');
  },

  /* ------------------------------ Leitura total -------------------------- */

  async fetchAll(userId: string): Promise<CloudSnapshot | null> {
    const [checkIns, sleepEntries, categories, behaviorEntries, journalEntries, recoveryPeriods, recoveryActivities] =
      await Promise.all([
        selectRows('check_ins', userId),
        selectRows('sleep_entries', userId),
        selectRows('behavior_categories', userId),
        selectRows('behavior_entries', userId),
        selectRows('journal_entries', userId),
        selectRows('recovery_periods', userId),
        selectRows('recovery_activities', userId),
      ]);

    if (
      checkIns === null ||
      sleepEntries === null ||
      categories === null ||
      behaviorEntries === null ||
      journalEntries === null ||
      recoveryPeriods === null ||
      recoveryActivities === null
    ) {
      return null;
    }

    return {
      checkIns: checkIns.map(toCheckIn),
      sleepEntries: sleepEntries.map(toSleep),
      categories: categories.map(toCategory),
      behaviorEntries: behaviorEntries.map(toBehavior),
      journalEntries: journalEntries.map(toJournal),
      recoveryPeriods: recoveryPeriods.map(toPeriod),
      recoveryActivities: recoveryActivities.map(toActivity),
    };
  },

  /* ------------------------------ Entidades ------------------------------ */

  pushCheckIn: (entry: CheckIn) => upsertRow('check_ins', checkInRow(entry), 'user_id,date'),
  pushSleep: (entry: SleepEntry) => upsertRow('sleep_entries', sleepRow(entry), 'user_id,date'),
  pushCategory: (entry: BehaviorCategory) =>
    upsertRow('behavior_categories', categoryRow(entry), 'id'),
  pushBehavior: (entry: BehaviorEntry) => upsertRow('behavior_entries', behaviorRow(entry), 'id'),
  pushJournal: (entry: JournalEntry) => upsertRow('journal_entries', journalRow(entry), 'id'),
  pushRecoveryPeriod: (entry: RecoveryPeriod) => upsertRow('recovery_periods', periodRow(entry), 'id'),
  pushRecoveryActivity: (entry: RecoveryActivity) =>
    upsertRow('recovery_activities', activityRow(entry), 'id'),

  deleteCheckIn: (id: string) => deleteRow('check_ins', id),
  deleteSleep: (id: string) => deleteRow('sleep_entries', id),
  deleteCategory: (id: string) => deleteRow('behavior_categories', id),
  deleteBehavior: (id: string) => deleteRow('behavior_entries', id),
  deleteJournal: (id: string) => deleteRow('journal_entries', id),
  deleteRecoveryPeriod: (id: string) => deleteRow('recovery_periods', id),
  deleteRecoveryActivity: (id: string) => deleteRow('recovery_activities', id),

  /** Reaplica uma operação pendente da fila local. */
  async applyOutbox(op: SyncOutboxOp): Promise<boolean> {
    if (op.type === 'delete') {
      return deleteRow(op.table, op.rowId || op.entityId);
    }

    switch (op.table) {
      case 'check_ins':
        return this.pushCheckIn(op.entity as CheckIn);
      case 'sleep_entries':
        return this.pushSleep(op.entity as SleepEntry);
      case 'behavior_categories':
        return this.pushCategory(op.entity as BehaviorCategory);
      case 'behavior_entries':
        return this.pushBehavior(op.entity as BehaviorEntry);
      case 'journal_entries':
        return this.pushJournal(op.entity as JournalEntry);
      case 'recovery_periods':
        return this.pushRecoveryPeriod(op.entity as RecoveryPeriod);
      case 'recovery_activities':
        return this.pushRecoveryActivity(op.entity as RecoveryActivity);
      case 'user_preferences':
        return this.upsertPreferences(op.entityId, op.entity as UserPreferences);
      case 'consent_records':
        return this.upsertConsent(op.entityId, op.entity as ConsentRecord);
      default:
        return false;
    }
  },

  /**
   * Apaga todos os dados do usuário na nuvem (mantém a conta de autenticação).
   * O perfil NÃO é apagado para permitir um novo início sem recriar a conta.
   */
  async deleteAllUserData(userId: string): Promise<boolean> {
    if (!supabase) return false;

    // Ordem respeita as chaves estrangeiras.
    const tables: SyncTable[] = [
      'recovery_activities',
      'behavior_entries',
      'recovery_periods',
      'behavior_categories',
      'journal_entries',
      'sleep_entries',
      'check_ins',
      'consent_records',
      'user_preferences',
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('user_id', userId);
      if (error) {
        console.warn(`[supabase] Falha ao apagar ${table}:`, error.message);
        return false;
      }
    }

    return true;
  },
};

export type { SupabaseUser };
