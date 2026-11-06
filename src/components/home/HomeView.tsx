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
  const todayStr = new Date().toISOString().split('T')[0];
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
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-1">
          Atalhos Rápidos
        </span>

        <div className="grid grid-cols-2 gap-3">
          {/* Sono shortcut */}
          {activeModules.sleep && (
            <button
              type="button"
              onClick={() => setShowSleepModal(true)}
              className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-left hover:border-indigo-300 dark:hover:border-indigo-800 shadow-xs hover:shadow-sm transition flex flex-col justify-between min-h-[96px] group"
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 group-hover:scale-105 transition">
                  <Moon className="w-5 h-5" />
                </div>
                {todaySleepEntry && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                  {todaySleepEntry ? 'Sono Registrado' : 'Registrar Sono'}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
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
              className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-left hover:border-rose-300 dark:hover:border-rose-800 shadow-xs hover:shadow-sm transition flex flex-col justify-between min-h-[96px] group"
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 group-hover:scale-105 transition">
                  <Flame className="w-5 h-5" />
                </div>
                {todayBehaviors.length > 0 && (
                  <span className="text-[10px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-full">
                    {todayBehaviors.length}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                  Registrar Impulso
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
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
              className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-left hover:border-emerald-300 dark:hover:border-emerald-800 shadow-xs hover:shadow-sm transition flex flex-col justify-between min-h-[96px] group"
            >
              <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 w-fit group-hover:scale-105 transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                  Escrever no Diário
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
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
              className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-left hover:border-teal-300 dark:hover:border-teal-800 shadow-xs hover:shadow-sm transition flex flex-col justify-between min-h-[96px] group"
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-2 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 group-hover:scale-105 transition">
                  <Compass className="w-5 h-5" />
                </div>
                {activeRecoveryPeriod && (
                  <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
                    {recoveryDays}d
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                  Minha Jornada
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                  {activeRecoveryPeriod ? activeRecoveryPeriod.label : 'Acompanhar presença'}
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 3. Discrete Day Summary (Only shown if data exists today) */}
      {(todayCheckIn || todaySleepEntry || todayBehaviors.length > 0) && (
        <div className="p-4 rounded-3xl bg-stone-100/70 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
            className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline flex items-center space-x-1 shrink-0"
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
