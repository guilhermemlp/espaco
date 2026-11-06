/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Integração com o Supabase (Auth + PostgreSQL + Row Level Security).
 * Se as credenciais estiverem configuradas via VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY,
 * os dados sincronizam com o banco em nuvem de forma privada.
 * Se não estiverem configuradas, o app opera com fallback gracioso em modo 100% Local-First.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  CheckIn, 
  SleepEntry, 
  BehaviorCategory, 
  BehaviorEntry, 
  JournalEntry, 
  RecoveryPeriod, 
  UserPreferences 
} from '../types';

// =========================================================================
// TAG DE CONTROLE SUPABASE (true / false)
// - false: Aplicação opera 100% como Local-First (dados no dispositivo, sem chamadas externas).
// - true: Ativa a sincronização e autenticação com Supabase em nuvem.
// =========================================================================
export const ENABLE_SUPABASE: boolean = 
  import.meta.env.VITE_ENABLE_SUPABASE === 'true';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  // Se a tag estiver false, opera estritamente como Local-First
  if (!ENABLE_SUPABASE) {
    return false;
  }

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
      },
    })
  : null;

// Sincronização remota quando o Supabase estiver ativo
export const supabaseSync = {
  // Check-ins
  async fetchCheckIns(): Promise<CheckIn[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        date: row.date,
        time: row.time,
        mood: row.mood,
        energy: row.energy,
        anxiety: row.anxiety,
        emotions: row.emotions || [],
        note: row.note,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (err) {
      console.warn('Erro ao carregar check-ins do Supabase:', err);
      return null;
    }
  },

  async upsertCheckIn(entry: CheckIn): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('check_ins').upsert(
        {
          id: entry.id.includes('-') && entry.id.length === 36 ? entry.id : undefined,
          user_id: entry.userId,
          date: entry.date,
          time: entry.time,
          mood: entry.mood,
          energy: entry.energy,
          anxiety: entry.anxiety,
          emotions: entry.emotions,
          note: entry.note,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date' }
      );
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Erro ao salvar check-in no Supabase:', err);
      return false;
    }
  },

  async deleteCheckIn(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('check_ins').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // Sono
  async fetchSleep(): Promise<SleepEntry[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('sleep_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        date: row.date,
        durationMinutes: row.duration_minutes,
        perceivedQuality: row.perceived_quality,
        bedtime: row.bedtime,
        wakeTime: row.wake_time,
        notes: row.notes,
        createdAt: row.created_at,
      }));
    } catch {
      return null;
    }
  },

  async upsertSleep(entry: SleepEntry): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('sleep_entries').upsert(
        {
          id: entry.id.includes('-') && entry.id.length === 36 ? entry.id : undefined,
          user_id: entry.userId,
          date: entry.date,
          duration_minutes: entry.durationMinutes,
          perceived_quality: entry.perceivedQuality,
          bedtime: entry.bedtime,
          wake_time: entry.wakeTime,
          notes: entry.notes,
        },
        { onConflict: 'user_id,date' }
      );
      return !error;
    } catch {
      return false;
    }
  },

  // Categorias de Impulsos
  async fetchCategories(): Promise<BehaviorCategory[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('behavior_categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        isCustom: row.is_custom,
        createdAt: row.created_at,
      }));
    } catch {
      return null;
    }
  },

  // Impulsos
  async fetchBehaviors(): Promise<BehaviorEntry[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('behavior_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        categoryId: row.category_id,
        date: row.date,
        time: row.time,
        urgeIntensity: row.urge_intensity,
        behaviorOccurrence: row.behavior_occurrence,
        perceivedControl: row.perceived_control,
        triggers: row.triggers,
        consequences: row.consequences,
        notes: row.notes,
        createdAt: row.created_at,
      }));
    } catch {
      return null;
    }
  },

  async upsertBehavior(entry: BehaviorEntry): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('behavior_entries').upsert({
        id: entry.id.includes('-') && entry.id.length === 36 ? entry.id : undefined,
        user_id: entry.userId,
        category_id: entry.categoryId,
        date: entry.date,
        time: entry.time,
        urge_intensity: entry.urgeIntensity,
        behavior_occurrence: entry.behaviorOccurrence,
        perceived_control: entry.perceivedControl,
        triggers: entry.triggers,
        consequences: entry.consequences,
        notes: entry.notes,
      });
      return !error;
    } catch {
      return false;
    }
  },

  // Diário
  async fetchJournal(): Promise<JournalEntry[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        date: row.date,
        time: row.time,
        title: row.title,
        content: row.content,
        tag: row.tag,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch {
      return null;
    }
  },

  async upsertJournal(entry: JournalEntry): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('journal_entries').upsert({
        id: entry.id.includes('-') && entry.id.length === 36 ? entry.id : undefined,
        user_id: entry.userId,
        date: entry.date,
        time: entry.time,
        title: entry.title,
        content: entry.content,
        tag: entry.tag || 'livre',
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch {
      return false;
    }
  },

  async deleteJournal(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('journal_entries').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // Jornada de Recuperação
  async fetchRecoveryPeriods(): Promise<RecoveryPeriod[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('recovery_periods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        label: row.label,
        startDate: row.start_date,
        endDate: row.end_date,
        isActive: row.is_active,
        notes: row.notes,
        createdAt: row.created_at,
      }));
    } catch {
      return null;
    }
  },

  async upsertRecoveryPeriod(entry: RecoveryPeriod): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('recovery_periods').upsert({
        id: entry.id.includes('-') && entry.id.length === 36 ? entry.id : undefined,
        user_id: entry.userId,
        label: entry.label,
        start_date: entry.startDate,
        end_date: entry.endDate,
        is_active: entry.isActive,
        notes: entry.notes,
      });
      return !error;
    } catch {
      return false;
    }
  },
};
