/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { QuickMoodSelector } from '../checkin/QuickMoodSelector';
import { SleepModal } from '../sleep/SleepModal';
import { BehaviorEntryModal } from '../behaviors/BehaviorEntryModal';
import { JournalEditorModal } from '../journal/JournalEditorModal';
import { TabType } from '../common/BottomNav';
import { todayLocalDate } from '../../utils/date';
import { 
  Moon, 
  Flame, 
  BookOpen, 
  Compass, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface HomeViewProps {
  onNavigateTab: (tab: TabType) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateTab }) => {
  const { preferences } = useAuth();
  const { activeModules } = preferences;
  const { 
    todayCheckIn, 
    todaySleepEntry, 
    behaviorEntries, 
    activeRecoveryPeriod, 
    calculateRecoveryDays 
  } = useData();

  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showBehaviorModal, setShowBehaviorModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);

  // Today's behaviors
  const todayStr = todayLocalDate();
  const todayBehaviors = behaviorEntries.filter(b => b.date === todayStr);

  const recoveryDays = activeRecoveryPeriod 
    ? calculateRecoveryDays(activeRecoveryPeriod.startDate) 
    : 0;

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* 1. Main Check-in Card (High priority, 1-tap) */}
      {activeModules.mood && <QuickMoodSelector />}

      {/* 2. Quick Action Shortcuts */}
      <div className="space-y-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted px-1">
          Atalhos Rápidos
        </span>

        <div className="grid grid-cols-2 gap-3">
          {/* Sono shortcut */}
          {activeModules.sleep && (
            <button
              type="button"
              onClick={() => setShowSleepModal(true)}
              className="p-4 rounded-3xl bg-raised border border-line text-left hover:border-info/25 dark:hover:border-info/25 shadow-xs hover:shadow-sm transition flex flex-col justify-between min-h-[96px] group"
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-2 rounded-2xl bg-info-soft dark:bg-info-soft/60 text-info dark:text-info group-hover:scale-105 transition">
                  <Moon className="w-5 h-5" />
                </div>
                {todaySleepEntry && (
                  <CheckCircle2 className="w-4 h-4 text-primary dark:text-primary" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">
                  {todaySleepEntry ? 'Sono Registrado' : 'Registrar Sono'}
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  {todaySleepEntry
                    ? `${Math.floor(todaySleepEntry.durationMinutes / 60)}h ${todaySleepEntry.durationMinutes % 60}m`
                    : 'Como foi sua noite?'}
                </p>
              </div>
            </button>
          )}

          {/* Impulso shortcut */}
          {activeModules.behaviors && (
            <button
              type="button"
              onClick={() => setShowBehaviorModal(true)}
              className="p-4 rounded-3xl bg-raised border border-line text-left hover:border-danger/25 dark:hover:border-danger/25 shadow-xs hover:shadow-sm transition flex flex-col justify-between min-h-[96px] group"
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-2 rounded-2xl bg-danger-soft dark:bg-danger-soft/60 text-danger dark:text-danger group-hover:scale-105 transition">
                  <Flame className="w-5 h-5" />
                </div>
                {todayBehaviors.length > 0 && (
                  <span className="text-[10px] font-semibold bg-danger-soft dark:bg-danger-soft text-danger dark:text-danger px-2 py-0.5 rounded-full">
                    {todayBehaviors.length}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">
                  Registrar Impulso
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Observar a vontade
                </p>
              </div>
            </button>
          )}

          {/* Diário shortcut */}
          {activeModules.journal && (
            <button
              type="button"
              onClick={() => setShowJournalModal(true)}
              className="p-4 rounded-3xl bg-raised border border-line text-left hover:border-primary/25 dark:hover:border-primary/25 shadow-xs hover:shadow-sm transition flex flex-col justify-between min-h-[96px] group"
            >
              <div className="p-2 rounded-2xl bg-primary-soft dark:bg-primary-soft/60 text-primary dark:text-primary w-fit group-hover:scale-105 transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">
                  Escrever no Diário
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Espaço livre e confidencial
                </p>
              </div>
            </button>
          )}

          {/* Jornada shortcut */}
          {activeModules.recovery && (
            <button
              type="button"
              onClick={() => onNavigateTab('recuperacao')}
              className="p-4 rounded-3xl bg-raised border border-line text-left hover:border-accent/25 dark:hover:border-accent/25 shadow-xs hover:shadow-sm transition flex flex-col justify-between min-h-[96px] group"
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-2 rounded-2xl bg-accent-soft dark:bg-accent-soft/60 text-accent dark:text-accent group-hover:scale-105 transition">
                  <Compass className="w-5 h-5" />
                </div>
                {activeRecoveryPeriod && (
                  <span className="text-[11px] font-bold text-accent dark:text-accent">
                    {recoveryDays}d
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">
                  Minha Jornada
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                  {activeRecoveryPeriod ? activeRecoveryPeriod.label : 'Acompanhar presença'}
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 3. Discrete Day Summary (Only shown if data exists today) */}
      {(todayCheckIn || todaySleepEntry || todayBehaviors.length > 0) && (
        <div className="p-4 rounded-3xl bg-sunken/70 dark:bg-raised/60 border border-line flex items-center justify-between text-xs text-ink-muted">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-primary dark:text-primary" />
            <span>
              Você registrou{' '}
              {[
                todayCheckIn ? 'humor' : null,
                todaySleepEntry ? 'sono' : null,
                todayBehaviors.length > 0 ? `${todayBehaviors.length} impulso(s)` : null,
              ]
                .filter(Boolean)
                .join(' e ')}{' '}
              hoje.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('insights')}
            className="text-primary dark:text-primary font-medium hover:underline flex items-center space-x-1 shrink-0"
          >
            <span>Ver padrões</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Modals triggered from shortcuts */}
      {showSleepModal && (
        <SleepModal
          initialData={todaySleepEntry}
          onClose={() => setShowSleepModal(false)}
        />
      )}

      {showBehaviorModal && (
        <BehaviorEntryModal
          onClose={() => setShowBehaviorModal(false)}
        />
      )}

      {showJournalModal && (
        <JournalEditorModal
          onClose={() => setShowJournalModal(false)}
        />
      )}
    </div>
  );
};
