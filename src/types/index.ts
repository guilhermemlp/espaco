/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Modelos de dados e tipos para a plataforma "Espaço".
 * Projetado com foco em privacidade, autonomia, não-diagnóstico
 * e ausência de julgamento.
 */

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodMeta {
  value: MoodLevel;
  label: string;
  description: string;
  iconName: string;
}

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type AnxietyLevel = 1 | 2 | 3 | 4 | 5;
export type SleepQuality = 1 | 2 | 3 | 4 | 5;

export type BehaviorOccurrence = 
  | 'nao_ocorreu' 
  | 'uma_vez' 
  | 'repetidamente' 
  | 'prefiro_nao_informar';

export type PerceivedControl = 
  | 'controle' 
  | 'alguma_dificuldade' 
  | 'perda_controle' 
  | 'nao_sei_avaliar';

export type RecoveryActivityType = 
  | 'reuniao' 
  | 'pratica_espiritual' 
  | 'meditacao' 
  | 'gratidao' 
  | 'reflexao';

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface ActiveModules {
  mood: boolean;
  sleep: boolean;
  behaviors: boolean;
  journal: boolean;
  recovery: boolean;
}

export interface UserPreferences {
  timezone: string;
  activeModules: ActiveModules;
  notificationsEnabled: boolean;
  notificationTime?: string;
  pinCode?: string | null;
  privacyBlurEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface CheckIn {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mood: MoodLevel;
  energy?: EnergyLevel | null;
  anxiety?: AnxietyLevel | null;
  emotions: string[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SleepEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number; // e.g. 450 = 7h 30m
  perceivedQuality: SleepQuality;
  bedtime?: string; // HH:mm
  wakeTime?: string; // HH:mm
  notes?: string;
  createdAt: string;
}

export interface BehaviorCategory {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isCustom: boolean;
  createdAt: string;
}

export interface BehaviorEntry {
  id: string;
  userId: string;
  categoryId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  urgeIntensity: number; // 0 a 10
  behaviorOccurrence: BehaviorOccurrence;
  perceivedControl: PerceivedControl;
  triggers?: string;
  consequences?: string;
  notes?: string;
  createdAt: string;
}

export type JournalTag = 
  | 'livre' 
  | 'reflexao' 
  | 'reuniao' 
  | 'gratidao' 
  | 'dificuldade' 
  | 'vitoria';

export interface NAMeditation {
  date: string;
  title: string;
  quote: string;
  source: string;
  body: string[];
  justForToday: string;
  copyright: string;
  sourceUrl: string;
  isFallback?: boolean;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title?: string;
  content: string;
  tag?: JournalTag | string;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryPeriod {
  id: string;
  userId: string;
  label: string; // ex: "Minha jornada", "Sem álcool", "Serenidade"
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // Se finalizado, preservado no histórico
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface RecoveryMilestone {
  id: string;
  periodId: string;
  days: number;
  title: string;
  description?: string;
}

export interface RecoveryActivity {
  id: string;
  userId: string;
  periodId: string;
  type: RecoveryActivityType;
  title: string;
  notes?: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface ConsentRecord {
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedAt: string;
}
