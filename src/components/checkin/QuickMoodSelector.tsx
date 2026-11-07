/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MoodLevel } from '../../types';
import { 
  CloudRain, 
  Cloud, 
  Minus, 
  Sun, 
  Sparkles, 
  Check, 
  Plus, 
  Edit3, 
  Trash2 
} from 'lucide-react';
import { useData as useDataContext } from '../../contexts/DataContext';
import { todayLocalDate } from '../../utils/date';
import { CheckInDetailModal } from './CheckInDetailModal';

export const MOOD_LEVELS: {
  level: MoodLevel;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  bgLight: string;
  bgDark: string;
  borderColor: string;
  textColor: string;
}[] = [
  {
    level: 1,
    label: 'Muito ruim',
    sublabel: 'Dia pesado',
    icon: <CloudRain className="w-6 h-6" />,
    bgLight: 'bg-stone-100 hover:bg-stone-200 text-stone-700',
    bgDark: 'dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300',
    borderColor: 'border-stone-300 dark:border-stone-700',
    textColor: 'text-stone-700 dark:text-stone-300',
  },
  {
    level: 2,
    label: 'Ruim',
    sublabel: 'Difícil',
    icon: <Cloud className="w-6 h-6" />,
    bgLight: 'bg-stone-100 hover:bg-stone-200 text-stone-700',
    bgDark: 'dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300',
    borderColor: 'border-stone-300 dark:border-stone-700',
    textColor: 'text-stone-700 dark:text-stone-300',
  },
  {
    level: 3,
    label: 'Neutro',
    sublabel: 'Equilibrado',
    icon: <Minus className="w-6 h-6" />,
    bgLight: 'bg-stone-100 hover:bg-stone-200 text-stone-700',
    bgDark: 'dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300',
    borderColor: 'border-stone-300 dark:border-stone-700',
    textColor: 'text-stone-700 dark:text-stone-300',
  },
  {
    level: 4,
    label: 'Bom',
    sublabel: 'Agradável',
    icon: <Sun className="w-6 h-6" />,
    bgLight: 'bg-stone-100 hover:bg-stone-200 text-stone-700',
    bgDark: 'dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300',
    borderColor: 'border-stone-300 dark:border-stone-700',
    textColor: 'text-stone-700 dark:text-stone-300',
  },
  {
    level: 5,
    label: 'Muito bom',
    sublabel: 'Radiante',
    icon: <Sparkles className="w-6 h-6" />,
    bgLight: 'bg-stone-100 hover:bg-stone-200 text-stone-700',
    bgDark: 'dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300',
    borderColor: 'border-stone-300 dark:border-stone-700',
    textColor: 'text-stone-700 dark:text-stone-300',
  },
];

export const QuickMoodSelector: React.FC = () => {
  const { todayCheckIn, saveCheckIn, deleteCheckIn } = useDataContext();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [justSavedNotification, setJustSavedNotification] = useState(false);

  const handleSelectMood = (mood: MoodLevel) => {
    const todayStr = todayLocalDate();
    const nowTime = new Date().toTimeString().slice(0, 5);

    saveCheckIn(
      {
        date: todayStr,
        time: nowTime,
        mood,
        energy: todayCheckIn?.energy || null,
        anxiety: todayCheckIn?.anxiety || null,
        emotions: todayCheckIn?.emotions || [],
        note: todayCheckIn?.note || '',
      },
      todayCheckIn?.id
    );

    setJustSavedNotification(true);
    setTimeout(() => {
      setJustSavedNotification(false);
    }, 3500);
  };

  const currentMoodMeta = todayCheckIn 
    ? MOOD_LEVELS.find(m => m.level === todayCheckIn.mood)
    : null;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 md:p-6 shadow-sm border border-stone-200/70 dark:border-stone-800 transition">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-400">
            Check-in Diário
          </span>
          <h2 className="text-base md:text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
            {todayCheckIn ? 'Seu estado hoje' : 'Como você está se sentindo agora?'}
          </h2>
        </div>

        {todayCheckIn && (
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setShowDetailModal(true)}
              className="p-1.5 rounded-xl text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              title="Editar detalhes"
              aria-label="Editar check-in do dia"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja remover o registro de hoje?')) {
                  deleteCheckIn(todayCheckIn.id);
                }
              }}
              className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 dark:text-stone-500 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              title="Excluir registro"
              aria-label="Excluir check-in"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 5-button 1-tap selector */}
      <div className="grid grid-cols-5 gap-1.5 md:gap-3 py-2">
        {MOOD_LEVELS.map(item => {
          const isSelected = todayCheckIn?.mood === item.level;
          return (
            <button
              key={item.level}
              type="button"
              onClick={() => handleSelectMood(item.level)}
              className={`flex flex-col items-center justify-center py-3 px-1 md:px-2 rounded-2xl border transition-all duration-200 cursor-pointer min-h-[76px] ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-500 ring-2 ring-emerald-500/30 scale-[1.03] shadow-xs'
                  : 'border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/70 dark:bg-stone-800/40 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              aria-label={`Registrar humor ${item.label}`}
              aria-pressed={isSelected}
            >
              <div
                className={`transition-colors duration-200 mb-1 ${
                  isSelected
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                {item.icon}
              </div>
              <span
                className={`text-[11px] md:text-xs font-medium tracking-tight text-center leading-tight ${
                  isSelected
                    ? 'text-emerald-900 dark:text-emerald-200 font-semibold'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback & Progressive disclosure prompt */}
      {todayCheckIn ? (
        <div className="mt-4 pt-3.5 border-t border-stone-100 dark:border-stone-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            {justSavedNotification ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Salvo com 1 toque!</span>
              </span>
            ) : (
              <span>
                Registrado às {todayCheckIn.time}
                {todayCheckIn.emotions.length > 0 && ` • ${todayCheckIn.emotions.slice(0, 3).join(', ')}`}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowDetailModal(true)}
            className="text-xs font-medium text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 flex items-center space-x-1 py-1 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {todayCheckIn.energy || todayCheckIn.anxiety || todayCheckIn.emotions.length > 0
                ? 'Editar detalhes'
                : 'Adicionar energia ou emoções'}
            </span>
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-stone-400 dark:text-stone-500 text-center">
          Um toque já salva o seu humor. Adicione detalhes apenas se quiser.
        </p>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <CheckInDetailModal
          initialData={todayCheckIn}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
};
