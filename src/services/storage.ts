/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Camada de armazenamento local por usuário.
 *
 * Princípios:
 * - Cada conta tem seu próprio namespace: espaco:u:<userId>:<chave>
 * - Nenhum dado de saúde é compartilhado entre contas no mesmo dispositivo.
 * - A nuvem (Supabase) é a fonte da verdade; o cache local serve para
 *   desempenho e uso offline.
 * - O PIN nunca é enviado para a nuvem e permanece apenas neste dispositivo.
 */

import {
  Profile,
  UserPreferences,
  CheckIn,
  SleepEntry,
  BehaviorCategory,
  BehaviorEntry,
  JournalEntry,
  RecoveryPeriod,
  RecoveryActivity,
  ConsentRecord,
} from '../types';
import { createId } from '../utils/id';
import { addDaysLocal } from '../utils/date';

const NS = 'espaco';

const GLOBAL_KEYS = {
  CURRENT_USER: `${NS}:session:current_user`,
};

const USER_KEYS = {
  PREFERENCES: 'preferences',
  CONSENT: 'consent',
  CHECK_INS: 'check_ins',
  SLEEP_ENTRIES: 'sleep_entries',
  BEHAVIOR_CATEGORIES: 'behavior_categories',
  BEHAVIOR_ENTRIES: 'behavior_entries',
  JOURNAL_ENTRIES: 'journal_entries',
  RECOVERY_PERIODS: 'recovery_periods',
  RECOVERY_ACTIVITIES: 'recovery_activities',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  OUTBOX: 'outbox',
} as const;

/** Chaves usadas pela versão antiga (globais). Servem apenas para importação explícita. */
const LEGACY_KEYS = {
  PREFERENCES: 'espaco_preferences',
  CONSENT: 'espaco_consent',
  CHECK_INS: 'espaco_check_ins',
  SLEEP_ENTRIES: 'espaco_sleep_entries',
  BEHAVIOR_CATEGORIES: 'espaco_behavior_categories',
  BEHAVIOR_ENTRIES: 'espaco_behavior_entries',
  JOURNAL_ENTRIES: 'espaco_journal_entries',
  RECOVERY_PERIODS: 'espaco_recovery_periods',
  RECOVERY_ACTIVITIES: 'espaco_recovery_activities',
  ONBOARDING_COMPLETED: 'espaco_onboarding_completed',
} as const;

let activeUserId: string | null = null;

export const DEFAULT_PREFERENCES: UserPreferences = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
  activeModules: {
    mood: true,
    sleep: true,
    behaviors: true,
    journal: true,
    recovery: true,
  },
  notificationsEnabled: false,
  notificationTime: '20:00',
  pinCode: null,
  privacyBlurEnabled: false,
  theme: 'light',
  onboardingCompleted: false,
};

const DEFAULT_CATEGORY_NAMES = [
  'Álcool',
  'Compras impulsivas',
  'Comer emocional',
  'Tempo excessivo de tela',
  'Nicotina',
];

export function createDefaultCategories(userId: string): BehaviorCategory[] {
  const createdAt = new Date().toISOString();
  return DEFAULT_CATEGORY_NAMES.map((name) => ({
    id: createId(),
    userId,
    name,
    isCustom: false,
    createdAt,
  }));
}

/* -------------------------------------------------------------------------- */
/* Infraestrutura                                                              */
/* -------------------------------------------------------------------------- */

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function userKey(base: string): string | null {
  if (!activeUserId) return null;
  return `${NS}:u:${activeUserId}:${base}`;
}

function readJSON<T>(key: string | null, fallback: T): T {
  if (!key || !storageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.warn(`[storage] Dados corrompidos em "${key}". Usando valor padrão.`, error);
    return fallback;
  }
}

function writeJSON(key: string | null, value: unknown): void {
  if (!key || !storageAvailable()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('[storage] Não foi possível salvar no dispositivo (cota ou modo privado).', error);
  }
}

function readArray<T>(base: string): T[] {
  const value = readJSON<unknown>(userKey(base), []);
  return Array.isArray(value) ? (value as T[]) : [];
}

function writeArray<T>(base: string, value: T[]): T[] {
  writeJSON(userKey(base), value);
  return value;
}

/* -------------------------------------------------------------------------- */
/* Sessão / namespace                                                          */
/* -------------------------------------------------------------------------- */

export const storageService = {
  /** Define o usuário ativo. Todas as leituras/escritas passam a usar o namespace dele. */
  setActiveUser(userId: string | null) {
    activeUserId = userId;
  },

  getActiveUser(): string | null {
    return activeUserId;
  },

  hasActiveUser(): boolean {
    return !!activeUserId;
  },

  getCurrentUser(): Profile | null {
    if (!storageAvailable()) return null;
    return readJSON<Profile | null>(GLOBAL_KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user: Profile | null) {
    if (!storageAvailable()) return;
    try {
      if (user) {
        window.localStorage.setItem(GLOBAL_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(GLOBAL_KEYS.CURRENT_USER);
      }
    } catch (error) {
      console.warn('[storage] Não foi possível salvar a sessão local.', error);
    }
  },

  /* ---------------------------------------------------------------------- */
  /* Preferências                                                            */
  /* ---------------------------------------------------------------------- */

  getPreferences(): UserPreferences {
    const stored = readJSON<Partial<UserPreferences> | null>(userKey(USER_KEYS.PREFERENCES), null);
    if (!stored) return { ...DEFAULT_PREFERENCES, activeModules: { ...DEFAULT_PREFERENCES.activeModules } };

    return {
      ...DEFAULT_PREFERENCES,
      ...stored,
      activeModules: {
        ...DEFAULT_PREFERENCES.activeModules,
        ...(stored.activeModules || {}),
      },
    };
  },

  setPreferences(prefs: UserPreferences) {
    writeJSON(userKey(USER_KEYS.PREFERENCES), prefs);
  },

  getConsent(): ConsentRecord | null {
    return readJSON<ConsentRecord | null>(userKey(USER_KEYS.CONSENT), null);
  },

  setConsent(consent: ConsentRecord) {
    writeJSON(userKey(USER_KEYS.CONSENT), consent);
  },

  isOnboardingCompleted(): boolean {
    return readJSON<boolean>(userKey(USER_KEYS.ONBOARDING_COMPLETED), false) === true;
  },

  setOnboardingCompleted(completed: boolean) {
    writeJSON(userKey(USER_KEYS.ONBOARDING_COMPLETED), completed);
  },

  /* ---------------------------------------------------------------------- */
  /* Check-ins                                                               */
  /* ---------------------------------------------------------------------- */

  getCheckIns(): CheckIn[] {
    return readArray<CheckIn>(USER_KEYS.CHECK_INS);
  },

  saveCheckIn(entry: CheckIn): CheckIn[] {
    const list = this.getCheckIns();
    const existingIndex = list.findIndex(
      (item) => item.id === entry.id || (item.date === entry.date && item.userId === entry.userId),
    );

    if (existingIndex >= 0) {
      const updated = [...list];
      updated[existingIndex] = { ...entry, updatedAt: new Date().toISOString() };
      return writeArray(USER_KEYS.CHECK_INS, updated);
    }

    return writeArray(USER_KEYS.CHECK_INS, [entry, ...list]);
  },

  deleteCheckIn(id: string): CheckIn[] {
    return writeArray(
      USER_KEYS.CHECK_INS,
      this.getCheckIns().filter((item) => item.id !== id),
    );
  },

  /* ---------------------------------------------------------------------- */
  /* Sono                                                                    */
  /* ---------------------------------------------------------------------- */

  getSleepEntries(): SleepEntry[] {
    return readArray<SleepEntry>(USER_KEYS.SLEEP_ENTRIES);
  },

  saveSleepEntry(entry: SleepEntry): SleepEntry[] {
    const list = this.getSleepEntries();
    const existingIndex = list.findIndex(
      (item) => item.id === entry.id || (item.date === entry.date && item.userId === entry.userId),
    );

    if (existingIndex >= 0) {
      const updated = [...list];
      updated[existingIndex] = entry;
      return writeArray(USER_KEYS.SLEEP_ENTRIES, updated);
    }

    return writeArray(USER_KEYS.SLEEP_ENTRIES, [entry, ...list]);
  },

  deleteSleepEntry(id: string): SleepEntry[] {
    return writeArray(
      USER_KEYS.SLEEP_ENTRIES,
      this.getSleepEntries().filter((item) => item.id !== id),
    );
  },

  /* ---------------------------------------------------------------------- */
  /* Categorias e impulsos                                                   */
  /* ---------------------------------------------------------------------- */

  getCategories(): BehaviorCategory[] {
    return readArray<BehaviorCategory>(USER_KEYS.BEHAVIOR_CATEGORIES);
  },

  saveCategory(category: BehaviorCategory): BehaviorCategory[] {
    const list = this.getCategories();
    const index = list.findIndex((item) => item.id === category.id);
    if (index >= 0) {
      const updated = [...list];
      updated[index] = category;
      return writeArray(USER_KEYS.BEHAVIOR_CATEGORIES, updated);
    }
    return writeArray(USER_KEYS.BEHAVIOR_CATEGORIES, [...list, category]);
  },

  deleteCategory(id: string): BehaviorCategory[] {
    return writeArray(
      USER_KEYS.BEHAVIOR_CATEGORIES,
      this.getCategories().filter((item) => item.id !== id),
    );
  },

  getBehaviorEntries(): BehaviorEntry[] {
    return readArray<BehaviorEntry>(USER_KEYS.BEHAVIOR_ENTRIES);
  },

  saveBehaviorEntry(entry: BehaviorEntry): BehaviorEntry[] {
    const list = this.getBehaviorEntries();
    const index = list.findIndex((item) => item.id === entry.id);
    if (index >= 0) {
      const updated = [...list];
      updated[index] = entry;
      return writeArray(USER_KEYS.BEHAVIOR_ENTRIES, updated);
    }
    return writeArray(USER_KEYS.BEHAVIOR_ENTRIES, [entry, ...list]);
  },

  deleteBehaviorEntry(id: string): BehaviorEntry[] {
    return writeArray(
      USER_KEYS.BEHAVIOR_ENTRIES,
      this.getBehaviorEntries().filter((item) => item.id !== id),
    );
  },

  deleteBehaviorEntriesByCategory(categoryId: string): BehaviorEntry[] {
    return writeArray(
      USER_KEYS.BEHAVIOR_ENTRIES,
      this.getBehaviorEntries().filter((item) => item.categoryId !== categoryId),
    );
  },

  /* ---------------------------------------------------------------------- */
  /* Diário                                                                  */
  /* ---------------------------------------------------------------------- */

  getJournalEntries(): JournalEntry[] {
    return readArray<JournalEntry>(USER_KEYS.JOURNAL_ENTRIES);
  },

  saveJournalEntry(entry: JournalEntry): JournalEntry[] {
    const list = this.getJournalEntries();
    const index = list.findIndex((item) => item.id === entry.id);
    if (index >= 0) {
      const updated = [...list];
      updated[index] = { ...entry, updatedAt: new Date().toISOString() };
      return writeArray(USER_KEYS.JOURNAL_ENTRIES, updated);
    }
    return writeArray(USER_KEYS.JOURNAL_ENTRIES, [entry, ...list]);
  },

  deleteJournalEntry(id: string): JournalEntry[] {
    return writeArray(
      USER_KEYS.JOURNAL_ENTRIES,
      this.getJournalEntries().filter((item) => item.id !== id),
    );
  },

  /* ---------------------------------------------------------------------- */
  /* Recuperação                                                             */
  /* ---------------------------------------------------------------------- */

  getRecoveryPeriods(): RecoveryPeriod[] {
    return readArray<RecoveryPeriod>(USER_KEYS.RECOVERY_PERIODS);
  },

  saveRecoveryPeriod(period: RecoveryPeriod): RecoveryPeriod[] {
    const list = this.getRecoveryPeriods();
    const index = list.findIndex((item) => item.id === period.id);

    if (index >= 0) {
      const updated = [...list];
      updated[index] = period;
      return writeArray(USER_KEYS.RECOVERY_PERIODS, updated);
    }

    // Um novo ciclo ativo encerra gentilmente os anteriores, sem apagá-los.
    const previousDeactivated = period.isActive
      ? list.map((item) =>
          item.isActive ? { ...item, isActive: false, endDate: period.startDate } : item,
        )
      : list;

    return writeArray(USER_KEYS.RECOVERY_PERIODS, [period, ...previousDeactivated]);
  },

  getRecoveryActivities(): RecoveryActivity[] {
    return readArray<RecoveryActivity>(USER_KEYS.RECOVERY_ACTIVITIES);
  },

  saveRecoveryActivity(activity: RecoveryActivity): RecoveryActivity[] {
    const list = this.getRecoveryActivities();
    const index = list.findIndex((item) => item.id === activity.id);
    if (index >= 0) {
      const updated = [...list];
      updated[index] = activity;
      return writeArray(USER_KEYS.RECOVERY_ACTIVITIES, updated);
    }
    return writeArray(USER_KEYS.RECOVERY_ACTIVITIES, [activity, ...list]);
  },

  deleteRecoveryActivity(id: string): RecoveryActivity[] {
    return writeArray(
      USER_KEYS.RECOVERY_ACTIVITIES,
      this.getRecoveryActivities().filter((item) => item.id !== id),
    );
  },

  /* ---------------------------------------------------------------------- */
  /* Sincronização: fila de operações pendentes                              */
  /* ---------------------------------------------------------------------- */

  getOutbox(): SyncOutboxOp[] {
    return readArray<SyncOutboxOp>(USER_KEYS.OUTBOX);
  },

  setOutbox(ops: SyncOutboxOp[]) {
    writeJSON(userKey(USER_KEYS.OUTBOX), ops);
  },

  enqueueOutbox(op: SyncOutboxOp) {
    const list = this.getOutbox();

    // Mantém apenas o estado mais recente por entidade:
    // - um novo upsert substitui upserts pendentes e cancela um delete anterior;
    // - um delete remove qualquer upsert/delete pendente da mesma entidade.
    const remaining = list.filter((item) => {
      if (item.table !== op.table || item.entityId !== op.entityId) return true;
      if (op.type === 'upsert') return item.type !== 'delete';
      return false;
    });

    const withoutOlderUpsert =
      op.type === 'upsert'
        ? remaining.filter(
            (item) =>
              !(
                item.table === op.table &&
                item.type === 'upsert' &&
                item.entityId === op.entityId
              ),
          )
        : remaining;

    this.setOutbox([...withoutOlderUpsert, op]);
  },

  /* ---------------------------------------------------------------------- */
  /* Substituição de dados vindos da nuvem                                   */
  /* ---------------------------------------------------------------------- */

  replaceAllData(data: {
    checkIns: CheckIn[];
    sleepEntries: SleepEntry[];
    categories: BehaviorCategory[];
    behaviorEntries: BehaviorEntry[];
    journalEntries: JournalEntry[];
    recoveryPeriods: RecoveryPeriod[];
    recoveryActivities: RecoveryActivity[];
  }) {
    writeArray(USER_KEYS.CHECK_INS, data.checkIns);
    writeArray(USER_KEYS.SLEEP_ENTRIES, data.sleepEntries);
    writeArray(USER_KEYS.BEHAVIOR_CATEGORIES, data.categories);
    writeArray(USER_KEYS.BEHAVIOR_ENTRIES, data.behaviorEntries);
    writeArray(USER_KEYS.JOURNAL_ENTRIES, data.journalEntries);
    writeArray(USER_KEYS.RECOVERY_PERIODS, data.recoveryPeriods);
    writeArray(USER_KEYS.RECOVERY_ACTIVITIES, data.recoveryActivities);
  },

  /* ---------------------------------------------------------------------- */
  /* Exportação / importação                                                 */
  /* ---------------------------------------------------------------------- */

  exportAllDataJSON(): string {
    const preferences = this.getPreferences();
    const allData = {
      exportDate: new Date().toISOString(),
      app: 'Espaço',
      version: '2.0.0',
      profile: this.getCurrentUser(),
      // PIN nunca sai do dispositivo.
      preferences: { ...preferences, pinCode: null },
      checkIns: this.getCheckIns(),
      sleepEntries: this.getSleepEntries(),
      categories: this.getCategories(),
      behaviors: this.getBehaviorEntries(),
      journal: this.getJournalEntries(),
      recoveryPeriods: this.getRecoveryPeriods(),
      recoveryActivities: this.getRecoveryActivities(),
    };
    return JSON.stringify(allData, null, 2);
  },

  exportCheckInsCSV(): string {
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const headers = [
      'Data',
      'Hora',
      'Humor (1-5)',
      'Energia (1-5)',
      'Ansiedade (1-5)',
      'Emocoes',
      'Observacao',
    ];

    const rows = this.getCheckIns().map((checkIn) =>
      [
        checkIn.date,
        checkIn.time,
        checkIn.mood,
        checkIn.energy ?? '',
        checkIn.anxiety ?? '',
        escape(checkIn.emotions.join(', ')),
        escape(checkIn.note || ''),
      ].join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  },

  importAllDataJSON(json: string): void {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Arquivo de backup inválido.');
    }
    if (!activeUserId) {
      throw new Error('Nenhuma conta ativa para importar o backup.');
    }

    const ownerId = activeUserId;
    const now = new Date().toISOString();
    const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

    /**
     * Garante que os dados importados pertençam à conta ativa.
     * IDs de outra conta (ou fora do padrão UUID) são regenerados para
     * não colidir com registros existentes na nuvem.
     */
    const remap = <T extends { id: string; userId: string }>(items: T[]): T[] =>
      items.map((item) => ({
        ...item,
        userId: ownerId,
        id: isUuid(item.id) && item.userId === ownerId ? item.id : createId(),
      }));

    let rawCategories = asArray<BehaviorCategory>(parsed.categories);
    if (rawCategories.length === 0) {
      rawCategories = createDefaultCategories(ownerId);
    }
    const categories = remap(rawCategories);
    const categoryIdMap = new Map(
      rawCategories.map((category, index) => [category.id, categories[index]?.id || category.id]),
    );
    const fallbackCategoryId = categories[0]?.id || '';

    const behaviors = remap(asArray<BehaviorEntry>(parsed.behaviors)).map((entry) => ({
      ...entry,
      categoryId: categoryIdMap.get(entry.categoryId) || fallbackCategoryId,
    }));

    const rawPeriods = asArray<RecoveryPeriod>(parsed.recoveryPeriods);
    const recoveryPeriods = remap(rawPeriods);
    const periodIdMap = new Map(
      rawPeriods.map((period, index) => [period.id, recoveryPeriods[index]?.id || period.id]),
    );
    const fallbackPeriodId = recoveryPeriods[0]?.id || '';

    const recoveryActivities = remap(asArray<RecoveryActivity>(parsed.recoveryActivities))
      .map((activity) => ({
        ...activity,
        periodId: periodIdMap.get(activity.periodId) || fallbackPeriodId,
      }))
      .filter((activity) => !!activity.periodId);

    const checkIns = remap(asArray<CheckIn>(parsed.checkIns)).map((entry) => ({
      ...entry,
      createdAt: entry.createdAt || now,
      updatedAt: entry.updatedAt || entry.createdAt || now,
    }));

    const journalEntries = remap(asArray<JournalEntry>(parsed.journal)).map((entry) => ({
      ...entry,
      createdAt: entry.createdAt || now,
      updatedAt: entry.updatedAt || entry.createdAt || now,
    }));

    this.replaceAllData({
      checkIns,
      sleepEntries: remap(asArray<SleepEntry>(parsed.sleepEntries)),
      categories,
      behaviorEntries: behaviors,
      journalEntries,
      recoveryPeriods,
      recoveryActivities,
    });

    if (parsed.preferences && typeof parsed.preferences === 'object') {
      const imported = parsed.preferences as UserPreferences;
      this.setPreferences({
        ...DEFAULT_PREFERENCES,
        ...imported,
        // PIN nunca é importado nem sai do dispositivo.
        pinCode: null,
      });
      this.setOnboardingCompleted(imported.onboardingCompleted === true);
    }
  },

  /* ---------------------------------------------------------------------- */
  /* Dados de exemplo                                                        */
  /* ---------------------------------------------------------------------- */

  seedSampleData(userId: string) {
    let categories = this.getCategories();
    if (categories.length === 0) {
      categories = createDefaultCategories(userId);
      categories.forEach((category) => this.saveCategory(category));
    }

    const dateAt = (offset: number) => addDaysLocal(-offset);
    const now = new Date().toISOString();

    const sampleCheckIns: CheckIn[] = [
      {
        id: createId(),
        userId,
        date: dateAt(0),
        time: '09:30',
        mood: 4,
        energy: 4,
        anxiety: 2,
        emotions: ['Calma', 'Clareza', 'Gratidão'],
        note: 'Acordei descansado após boa noite de sono.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: createId(),
        userId,
        date: dateAt(1),
        time: '14:15',
        mood: 3,
        energy: 3,
        anxiety: 3,
        emotions: ['Cansaço', 'Calma'],
        note: 'Dia com bastante trabalho, ritmo constante.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: createId(),
        userId,
        date: dateAt(2),
        time: '19:40',
        mood: 2,
        energy: 2,
        anxiety: 4,
        emotions: ['Irritação', 'Sobrecarga'],
        note: 'Bastante ruído externo à tarde, busquei respirar fundo.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: createId(),
        userId,
        date: dateAt(4),
        time: '10:00',
        mood: 4,
        energy: 3,
        anxiety: 2,
        emotions: ['Tranquilidade'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: createId(),
        userId,
        date: dateAt(6),
        time: '11:20',
        mood: 5,
        energy: 5,
        anxiety: 1,
        emotions: ['Alegria', 'Esperança'],
        note: 'Caminhada matinal ao ar livre fez muito bem.',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const sampleSleep: SleepEntry[] = [
      {
        id: createId(),
        userId,
        date: dateAt(0),
        durationMinutes: 465,
        perceivedQuality: 4,
        bedtime: '23:00',
        wakeTime: '06:45',
        notes: 'Sono contínuo',
        createdAt: now,
      },
      {
        id: createId(),
        userId,
        date: dateAt(1),
        durationMinutes: 390,
        perceivedQuality: 3,
        bedtime: '23:45',
        wakeTime: '06:15',
        createdAt: now,
      },
      {
        id: createId(),
        userId,
        date: dateAt(2),
        durationMinutes: 330,
        perceivedQuality: 2,
        bedtime: '00:30',
        wakeTime: '06:00',
        notes: 'Acordei durante a madrugada',
        createdAt: now,
      },
    ];

    const sampleBehaviors: BehaviorEntry[] = [
      {
        id: createId(),
        userId,
        categoryId: categories[0]?.id || '',
        date: dateAt(1),
        time: '21:00',
        urgeIntensity: 6,
        behaviorOccurrence: 'nao_ocorreu',
        perceivedControl: 'controle',
        triggers: 'Fim de semana, convite de amigos',
        consequences: 'Bebi chá e fiz uma leitura tranquila.',
        createdAt: now,
      },
      {
        id: createId(),
        userId,
        categoryId: categories[1]?.id || categories[0]?.id || '',
        date: dateAt(3),
        time: '16:30',
        urgeIntensity: 4,
        behaviorOccurrence: 'nao_ocorreu',
        perceivedControl: 'alguma_dificuldade',
        triggers: 'Anúncios em redes sociais',
        createdAt: now,
      },
    ];

    const sampleJournal: JournalEntry[] = [
      {
        id: createId(),
        userId,
        date: dateAt(0),
        time: '21:15',
        title: 'Espaço para desacelerar',
        content:
          'Hoje percebi como é bom ter um momento para respirar sem cobrança de produtividade. Não preciso resolver todas as pendências da semana em uma única tarde. Um passo de cada vez.',
        tag: 'livre',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: createId(),
        userId,
        date: dateAt(3),
        time: '20:00',
        title: 'Observando os impulsos',
        content:
          'A vontade surgiu forte no final da tarde, mas me dei 15 minutos antes de tomar qualquer decisão. Quando a poeira baixou, percebi que era apenas cansaço acumulado.',
        tag: 'reflexao',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const sampleRecoveryPeriod: RecoveryPeriod = {
      id: createId(),
      userId,
      label: 'Nova jornada de clareza',
      startDate: dateAt(42),
      isActive: true,
      notes: 'Compromisso com minha serenidade e bem-estar.',
      createdAt: now,
    };

    const sampleActivities: RecoveryActivity[] = [
      {
        id: createId(),
        userId,
        periodId: sampleRecoveryPeriod.id,
        type: 'meditacao',
        title: 'Respiração consciente 10 min',
        notes: 'Manhã tranquila',
        date: dateAt(0),
        createdAt: now,
      },
      {
        id: createId(),
        userId,
        periodId: sampleRecoveryPeriod.id,
        type: 'gratidao',
        title: 'Pela presença de amigos que apoiam meu processo',
        date: dateAt(2),
        createdAt: now,
      },
    ];

    const snapshot = {
      checkIns: sampleCheckIns,
      sleepEntries: sampleSleep,
      categories,
      behaviorEntries: sampleBehaviors,
      journalEntries: sampleJournal,
      recoveryPeriods: [sampleRecoveryPeriod],
      recoveryActivities: sampleActivities,
    };

    this.replaceAllData(snapshot);

    // Devolve o snapshot para que o chamador possa enviá-lo à nuvem
    // quando o usuário estiver autenticado.
    return snapshot;
  },

  /* ---------------------------------------------------------------------- */
  /* Apagamento                                                              */
  /* ---------------------------------------------------------------------- */

  /** Remove todos os dados do usuário ativo deste dispositivo. */
  wipeActiveUserData() {
    if (!storageAvailable()) return;
    if (!activeUserId) {
      window.localStorage.removeItem(GLOBAL_KEYS.CURRENT_USER);
      return;
    }

    const prefix = `${NS}:u:${activeUserId}:`;
    const keysToRemove: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith(prefix)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    window.localStorage.removeItem(GLOBAL_KEYS.CURRENT_USER);
  },

  /* ---------------------------------------------------------------------- */
  /* Importação dos dados globais da versão anterior                         */
  /* ---------------------------------------------------------------------- */

  hasLegacyData(): boolean {
    if (!storageAvailable()) return false;
    return Object.values(LEGACY_KEYS).some((key) => window.localStorage.getItem(key) !== null);
  },

  /**
   * Copia os dados globais antigos para o namespace do usuário ativo.
   * Deve ser chamado apenas após confirmação explícita do usuário.
   */
  importLegacyData(): boolean {
    if (!storageAvailable() || !activeUserId) return false;

    const legacyRead = <T>(key: string, fallback: T): T => {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
      } catch {
        return fallback;
      }
    };

    const checkIns = legacyRead<CheckIn[]>(LEGACY_KEYS.CHECK_INS, []);
    const sleepEntries = legacyRead<SleepEntry[]>(LEGACY_KEYS.SLEEP_ENTRIES, []);
    const categories = legacyRead<BehaviorCategory[]>(LEGACY_KEYS.BEHAVIOR_CATEGORIES, []);
    const behaviorEntries = legacyRead<BehaviorEntry[]>(LEGACY_KEYS.BEHAVIOR_ENTRIES, []);
    const journalEntries = legacyRead<JournalEntry[]>(LEGACY_KEYS.JOURNAL_ENTRIES, []);
    const recoveryPeriods = legacyRead<RecoveryPeriod[]>(LEGACY_KEYS.RECOVERY_PERIODS, []);
    const recoveryActivities = legacyRead<RecoveryActivity[]>(LEGACY_KEYS.RECOVERY_ACTIVITIES, []);

    // Reatribui os dados ao usuário ativo e garante IDs UUID.
    const remap = <T extends { id: string; userId: string }>(items: T[]): T[] =>
      items.map((item) => ({
        ...item,
        id: isUuid(item.id) ? item.id : createId(),
        userId: activeUserId as string,
      }));

    const validCategories = remap(categories);
    const categoryIdMap = new Map(
      categories.map((category, index) => [category.id, validCategories[index]?.id || category.id]),
    );

    const fallbackCategoryId = validCategories[0]?.id || '';
    const validBehaviors = remap(behaviorEntries).map((entry) => ({
      ...entry,
      categoryId: categoryIdMap.get(entry.categoryId) || fallbackCategoryId,
    }));

    const validPeriods = remap(recoveryPeriods);
    const periodIdMap = new Map(
      recoveryPeriods.map((period, index) => [period.id, validPeriods[index]?.id || period.id]),
    );

    const validActivities = remap(recoveryActivities).map((activity) => ({
      ...activity,
      periodId: periodIdMap.get(activity.periodId) || activity.periodId,
    }));

    this.replaceAllData({
      checkIns: remap(checkIns),
      sleepEntries: remap(sleepEntries),
      categories: validCategories,
      behaviorEntries: validBehaviors,
      journalEntries: remap(journalEntries),
      recoveryPeriods: validPeriods,
      recoveryActivities: validActivities,
    });

    const legacyPreferences = legacyRead<UserPreferences | null>(LEGACY_KEYS.PREFERENCES, null);
    if (legacyPreferences) {
      this.setPreferences({ ...legacyPreferences, pinCode: null });
    }

    if (legacyRead<boolean>(LEGACY_KEYS.ONBOARDING_COMPLETED, false)) {
      this.setOnboardingCompleted(true);
    }

    // Remove as chaves antigas após a cópia bem-sucedida.
    Object.values(LEGACY_KEYS).forEach((key) => window.localStorage.removeItem(key));
    return true;
  },
};

/* -------------------------------------------------------------------------- */
/* Fila de sincronização                                                       */
/* -------------------------------------------------------------------------- */

export type SyncTable =
  | 'check_ins'
  | 'sleep_entries'
  | 'behavior_categories'
  | 'behavior_entries'
  | 'journal_entries'
  | 'recovery_periods'
  | 'recovery_activities'
  | 'user_preferences'
  | 'consent_records';

export interface SyncOutboxOp {
  id: string;
  table: SyncTable;
  type: 'upsert' | 'delete';
  entityId: string;
  entity?: unknown;
  rowId?: string;
  createdAt: string;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
