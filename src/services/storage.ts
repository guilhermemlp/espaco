/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Camada de armazenamento local e privacidade para o "Espaço".
 * Todos os dados são mantidos localmente no navegador do usuário,
 * garantindo total autonomia, sem envio não autorizado para servidores externos.
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
  ConsentRecord 
} from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'espaco_current_user',
  PREFERENCES: 'espaco_preferences',
  CONSENT: 'espaco_consent',
  CHECK_INS: 'espaco_check_ins',
  SLEEP_ENTRIES: 'espaco_sleep_entries',
  BEHAVIOR_CATEGORIES: 'espaco_behavior_categories',
  BEHAVIOR_ENTRIES: 'espaco_behavior_entries',
  JOURNAL_ENTRIES: 'espaco_journal_entries',
  RECOVERY_PERIODS: 'espaco_recovery_periods',
  RECOVERY_ACTIVITIES: 'espaco_recovery_activities',
  ONBOARDING_COMPLETED: 'espaco_onboarding_completed'
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
  activeModules: {
    mood: true,
    sleep: true,
    behaviors: true,
    journal: true,
    recovery: true,
  },
  notificationsEnabled: false, // Inegociável: desligado por padrão
  notificationTime: '20:00',
  pinCode: null,
  privacyBlurEnabled: false,
  theme: 'light'
};

export const DEFAULT_BEHAVIOR_CATEGORIES: BehaviorCategory[] = [
  { id: 'cat-1', userId: 'local-user', name: 'Álcool', isCustom: false, createdAt: new Date().toISOString() },
  { id: 'cat-2', userId: 'local-user', name: 'Compras impulsivas', isCustom: false, createdAt: new Date().toISOString() },
  { id: 'cat-3', userId: 'local-user', name: 'Comer emocional', isCustom: false, createdAt: new Date().toISOString() },
  { id: 'cat-4', userId: 'local-user', name: 'Tempo excessivo de tela', isCustom: false, createdAt: new Date().toISOString() },
  { id: 'cat-5', userId: 'local-user', name: 'Nicotina', isCustom: false, createdAt: new Date().toISOString() },
];

// Helper to seed gentle sample data for testing when requested
export function seedSampleData(userId: string) {
  const today = new Date();
  const formatDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  };

  const sampleCheckIns: CheckIn[] = [
    {
      id: 'chk-1',
      userId,
      date: formatDate(0),
      time: '09:30',
      mood: 4,
      energy: 4,
      anxiety: 2,
      emotions: ['calma', 'clareza', 'gratidão'],
      note: 'Acordei descansado após boa noite de sono.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'chk-2',
      userId,
      date: formatDate(1),
      time: '14:15',
      mood: 3,
      energy: 3,
      anxiety: 3,
      emotions: ['cansaço', 'calma'],
      note: 'Dia com bastante trabalho, ritmo constante.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'chk-3',
      userId,
      date: formatDate(2),
      time: '19:40',
      mood: 2,
      energy: 2,
      anxiety: 4,
      emotions: ['irritação', 'sobrecarga'],
      note: 'Bastante ruído externo à tarde, busquei respirar fundo.',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 'chk-4',
      userId,
      date: formatDate(4),
      time: '10:00',
      mood: 4,
      energy: 3,
      anxiety: 2,
      emotions: ['tranquilidade'],
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      updatedAt: new Date(Date.now() - 345600000).toISOString()
    },
    {
      id: 'chk-5',
      userId,
      date: formatDate(6),
      time: '11:20',
      mood: 5,
      energy: 5,
      anxiety: 1,
      emotions: ['alegria', 'esperança'],
      note: 'Caminhada matinal ao ar livre fez muito bem.',
      createdAt: new Date(Date.now() - 518400000).toISOString(),
      updatedAt: new Date(Date.now() - 518400000).toISOString()
    }
  ];

  const sampleSleep: SleepEntry[] = [
    {
      id: 'slp-1',
      userId,
      date: formatDate(0),
      durationMinutes: 465, // 7h 45m
      perceivedQuality: 4,
      bedtime: '23:00',
      wakeTime: '06:45',
      notes: 'Sono contínuo',
      createdAt: new Date().toISOString()
    },
    {
      id: 'slp-2',
      userId,
      date: formatDate(1),
      durationMinutes: 390, // 6h 30m
      perceivedQuality: 3,
      bedtime: '23:45',
      wakeTime: '06:15',
      createdAt: new Date().toISOString()
    },
    {
      id: 'slp-3',
      userId,
      date: formatDate(2),
      durationMinutes: 330, // 5h 30m
      perceivedQuality: 2,
      bedtime: '00:30',
      wakeTime: '06:00',
      notes: 'Acordei durante a madrugada',
      createdAt: new Date().toISOString()
    }
  ];

  const sampleBehaviors: BehaviorEntry[] = [
    {
      id: 'beh-1',
      userId,
      categoryId: 'cat-1', // Álcool
      date: formatDate(1),
      time: '21:00',
      urgeIntensity: 6,
      behaviorOccurrence: 'nao_ocorreu',
      perceivedControl: 'controle',
      triggers: 'Fim de semana, convite de amigos',
      consequences: 'Bebi chá e fiz uma leitura tranquila.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'beh-2',
      userId,
      categoryId: 'cat-2', // Compras
      date: formatDate(3),
      time: '16:30',
      urgeIntensity: 4,
      behaviorOccurrence: 'nao_ocorreu',
      perceivedControl: 'alguma_dificuldade',
      triggers: 'Anúncios em redes sociais',
      createdAt: new Date().toISOString()
    }
  ];

  const sampleJournal: JournalEntry[] = [
    {
      id: 'jrn-1',
      userId,
      date: formatDate(0),
      time: '21:15',
      title: 'Espaço para desacelerar',
      content: 'Hoje percebi como é bom ter um momento para respirar sem cobrança de produtividade. Não preciso resolver todas as pendências da semana em uma única tarde. Um passo de cada vez.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'jrn-2',
      userId,
      date: formatDate(3),
      time: '20:00',
      title: 'Observando os impulsos',
      content: 'A vontade surgiu forte no final da tarde, mas me dei 15 minutos antes de tomar qualquer decisão. Quando a poeira baixou, percebi que era apenas cansaço acumulado.',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date(Date.now() - 259200000).toISOString()
    }
  ];

  const sampleRecoveryPeriod: RecoveryPeriod = {
    id: 'rec-1',
    userId,
    label: 'Nova jornada de clareza',
    startDate: formatDate(42), // 42 dias atrás
    isActive: true,
    notes: 'Compromisso com minha serenidade e bem-estar.',
    createdAt: new Date().toISOString()
  };

  const sampleActivities: RecoveryActivity[] = [
    {
      id: 'act-1',
      userId,
      periodId: 'rec-1',
      type: 'meditacao',
      title: 'Respiração consciente 10 min',
      notes: 'Manhã tranquila',
      date: formatDate(0),
      createdAt: new Date().toISOString()
    },
    {
      id: 'act-2',
      userId,
      periodId: 'rec-1',
      type: 'gratidao',
      title: 'Pela presença de amigos que apoiam meu processo',
      date: formatDate(2),
      createdAt: new Date().toISOString()
    },
    {
      id: 'act-3',
      userId,
      periodId: 'rec-1',
      type: 'reuniao',
      title: 'Encontro do grupo de apoio online',
      notes: 'Partilha acolhedora e inspiradora',
      date: formatDate(5),
      createdAt: new Date().toISOString()
    }
  ];

  localStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(sampleCheckIns));
  localStorage.setItem(STORAGE_KEYS.SLEEP_ENTRIES, JSON.stringify(sampleSleep));
  localStorage.setItem(STORAGE_KEYS.BEHAVIOR_ENTRIES, JSON.stringify(sampleBehaviors));
  localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(sampleJournal));
  localStorage.setItem(STORAGE_KEYS.RECOVERY_PERIODS, JSON.stringify([sampleRecoveryPeriod]));
  localStorage.setItem(STORAGE_KEYS.RECOVERY_ACTIVITIES, JSON.stringify(sampleActivities));
}

// Storage helpers
export const storageService = {
  getCurrentUser(): Profile | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  },

  setCurrentUser(user: Profile | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getPreferences(): UserPreferences {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!raw) return DEFAULT_PREFERENCES;
    try {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  setPreferences(prefs: UserPreferences) {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  },

  getConsent(): ConsentRecord | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CONSENT);
    return raw ? JSON.parse(raw) : null;
  },

  setConsent(consent: ConsentRecord) {
    localStorage.setItem(STORAGE_KEYS.CONSENT, JSON.stringify(consent));
  },

  isOnboardingCompleted(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
  },

  setOnboardingCompleted(completed: boolean) {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed ? 'true' : 'false');
  },

  // Check-ins
  getCheckIns(): CheckIn[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECK_INS);
    return raw ? JSON.parse(raw) : [];
  },

  saveCheckIn(entry: CheckIn): CheckIn[] {
    const list = this.getCheckIns();
    const existingIndex = list.findIndex(i => i.id === entry.id || (i.date === entry.date && i.userId === entry.userId));
    let updated: CheckIn[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = { ...entry, updatedAt: new Date().toISOString() };
    } else {
      updated = [entry, ...list];
    }
    localStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(updated));
    return updated;
  },

  deleteCheckIn(id: string): CheckIn[] {
    const updated = this.getCheckIns().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(updated));
    return updated;
  },

  // Sleep
  getSleepEntries(): SleepEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SLEEP_ENTRIES);
    return raw ? JSON.parse(raw) : [];
  },

  saveSleepEntry(entry: SleepEntry): SleepEntry[] {
    const list = this.getSleepEntries();
    const existingIndex = list.findIndex(i => i.id === entry.id || (i.date === entry.date && i.userId === entry.userId));
    let updated: SleepEntry[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = entry;
    } else {
      updated = [entry, ...list];
    }
    localStorage.setItem(STORAGE_KEYS.SLEEP_ENTRIES, JSON.stringify(updated));
    return updated;
  },

  deleteSleepEntry(id: string): SleepEntry[] {
    const updated = this.getSleepEntries().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.SLEEP_ENTRIES, JSON.stringify(updated));
    return updated;
  },

  // Categories & Behaviors
  getCategories(): BehaviorCategory[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BEHAVIOR_CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BEHAVIOR_CATEGORIES, JSON.stringify(DEFAULT_BEHAVIOR_CATEGORIES));
      return DEFAULT_BEHAVIOR_CATEGORIES;
    }
    return JSON.parse(raw);
  },

  saveCategory(cat: BehaviorCategory): BehaviorCategory[] {
    const list = this.getCategories();
    const idx = list.findIndex(c => c.id === cat.id);
    let updated: BehaviorCategory[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = cat;
    } else {
      updated = [...list, cat];
    }
    localStorage.setItem(STORAGE_KEYS.BEHAVIOR_CATEGORIES, JSON.stringify(updated));
    return updated;
  },

  deleteCategory(id: string): BehaviorCategory[] {
    const updated = this.getCategories().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.BEHAVIOR_CATEGORIES, JSON.stringify(updated));
    return updated;
  },

  getBehaviorEntries(): BehaviorEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BEHAVIOR_ENTRIES);
    return raw ? JSON.parse(raw) : [];
  },

  saveBehaviorEntry(entry: BehaviorEntry): BehaviorEntry[] {
    const list = this.getBehaviorEntries();
    const idx = list.findIndex(e => e.id === entry.id);
    let updated: BehaviorEntry[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = entry;
    } else {
      updated = [entry, ...list];
    }
    localStorage.setItem(STORAGE_KEYS.BEHAVIOR_ENTRIES, JSON.stringify(updated));
    return updated;
  },

  deleteBehaviorEntry(id: string): BehaviorEntry[] {
    const updated = this.getBehaviorEntries().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.BEHAVIOR_ENTRIES, JSON.stringify(updated));
    return updated;
  },

  // Journal
  getJournalEntries(): JournalEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    return raw ? JSON.parse(raw) : [];
  },

  saveJournalEntry(entry: JournalEntry): JournalEntry[] {
    const list = this.getJournalEntries();
    const idx = list.findIndex(e => e.id === entry.id);
    let updated: JournalEntry[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = { ...entry, updatedAt: new Date().toISOString() };
    } else {
      updated = [entry, ...list];
    }
    localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(updated));
    return updated;
  },

  deleteJournalEntry(id: string): JournalEntry[] {
    const updated = this.getJournalEntries().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(updated));
    return updated;
  },

  // Recovery
  getRecoveryPeriods(): RecoveryPeriod[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RECOVERY_PERIODS);
    return raw ? JSON.parse(raw) : [];
  },

  saveRecoveryPeriod(period: RecoveryPeriod): RecoveryPeriod[] {
    const list = this.getRecoveryPeriods();
    const idx = list.findIndex(p => p.id === period.id);
    let updated: RecoveryPeriod[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = period;
    } else {
      // If setting a new active period, deactivate prior ones gently without deleting
      const previousDeactivated = period.isActive 
        ? list.map(p => p.isActive ? { ...p, isActive: false, endDate: period.startDate } : p)
        : list;
      updated = [period, ...previousDeactivated];
    }
    localStorage.setItem(STORAGE_KEYS.RECOVERY_PERIODS, JSON.stringify(updated));
    return updated;
  },

  getRecoveryActivities(): RecoveryActivity[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RECOVERY_ACTIVITIES);
    return raw ? JSON.parse(raw) : [];
  },

  saveRecoveryActivity(activity: RecoveryActivity): RecoveryActivity[] {
    const list = this.getRecoveryActivities();
    const updated = [activity, ...list];
    localStorage.setItem(STORAGE_KEYS.RECOVERY_ACTIVITIES, JSON.stringify(updated));
    return updated;
  },

  deleteRecoveryActivity(id: string): RecoveryActivity[] {
    const updated = this.getRecoveryActivities().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.RECOVERY_ACTIVITIES, JSON.stringify(updated));
    return updated;
  },

  // Export / Import / Wipe
  exportAllDataJSON(): string {
    const allData = {
      exportDate: new Date().toISOString(),
      app: 'Espaço',
      version: '1.0.0',
      profile: this.getCurrentUser(),
      preferences: this.getPreferences(),
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
    const checkIns = this.getCheckIns();
    const headers = ['Data', 'Hora', 'Humor (1-5)', 'Energia (1-5)', 'Ansiedade (1-5)', 'Emocoes', 'Observacao'];
    const rows = checkIns.map(c => [
      c.date,
      c.time,
      c.mood,
      c.energy || '',
      c.anxiety || '',
      `"${c.emotions.join(', ')}"`,
      `"${(c.note || '').replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  wipeAllData() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    localStorage.removeItem(STORAGE_KEYS.CONSENT);
    localStorage.removeItem(STORAGE_KEYS.CHECK_INS);
    localStorage.removeItem(STORAGE_KEYS.SLEEP_ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.BEHAVIOR_CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.BEHAVIOR_ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.RECOVERY_PERIODS);
    localStorage.removeItem(STORAGE_KEYS.RECOVERY_ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
  }
};
