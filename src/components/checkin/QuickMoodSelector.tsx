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
  /** Cor do ícone — própria de cada nível, sem conotação bom/ruim */
  iconClass: string;
  /** Fundo suave quando o nível está selecionado */
  softClass: string;
  /** Borda do nível selecionado */
  borderClass: string;
  /** Anel do nível selecionado */
  ringClass: string;
  /** Realce neutro no hover */
  hoverClass: string;
}[] = [
  {
    level: 1,
    label: 'Muito ruim',
    sublabel: 'Dia pesado',
    icon: <CloudRain className="w-6 h-6" />,
    iconClass: 'text-mood-1',
    softClass: 'bg-mood-1-soft',
    borderClass: 'border-mood-1',
    ringClass: 'ring-mood-1/25',
    hoverClass: 'hover:bg-mood-1-soft/60',
  },
  {
    level: 2,
    label: 'Ruim',
    sublabel: 'Difícil',
    icon: <Cloud className="w-6 h-6" />,
    iconClass: 'text-mood-2',
    softClass: 'bg-mood-2-soft',
    borderClass: 'border-mood-2',
    ringClass: 'ring-mood-2/25',
    hoverClass: 'hover:bg-mood-2-soft/60',
  },
  {
    level: 3,
    label: 'Neutro',
    sublabel: 'Equilibrado',
    icon: <Minus className="w-6 h-6" />,
    iconClass: 'text-mood-3',
    softClass: 'bg-mood-3-soft',
    borderClass: 'border-mood-3',
    ringClass: 'ring-mood-3/25',
    hoverClass: 'hover:bg-mood-3-soft/60',
  },
  {
    level: 4,
    label: 'Bom',
    sublabel: 'Agradável',
    icon: <Sun className="w-6 h-6" />,
    iconClass: 'text-mood-4',
    softClass: 'bg-mood-4-soft',
    borderClass: 'border-mood-4',
    ringClass: 'ring-mood-4/25',
    hoverClass: 'hover:bg-mood-4-soft/60',
  },
  {
    level: 5,
    label: 'Muito bom',
    sublabel: 'Radiante',
    icon: <Sparkles className="w-6 h-6" />,
    iconClass: 'text-mood-5',
    softClass: 'bg-mood-5-soft',
    borderClass: 'border-mood-5',
    ringClass: 'ring-mood-5/25',
    hoverClass: 'hover:bg-mood-5-soft/60',
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
    <div className="bg-raised rounded-3xl p-5 md:p-6 shadow-sm border border-line transition">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-primary dark:text-primary">
            Check-in Diário
          </span>
          <h2 className="text-base md:text-lg font-serif font-medium text-ink">
            {todayCheckIn ? 'Seu estado hoje' : 'Como você está se sentindo agora?'}
          </h2>
        </div>

        {todayCheckIn && (
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setShowDetailModal(true)}
              className="p-1.5 rounded-xl text-ink-muted hover:text-ink hover:bg-sunken-strong transition"
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
              className="p-1.5 rounded-xl text-ink-subtle hover:text-danger dark:text-ink-muted dark:hover:text-danger hover:bg-sunken-strong transition"
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
                  ? `${item.softClass} ${item.borderClass} ring-2 ${item.ringClass} scale-[1.03] shadow-xs`
                  : `border-line bg-sunken hover:border-line-strong ${item.hoverClass}`
              }`}
              aria-label={`Registrar humor ${item.label}`}
              aria-pressed={isSelected}
            >
              <div className={`${item.iconClass} transition-colors duration-200 mb-1`}>
                {item.icon}
              </div>
              <span
                className={`text-[11px] md:text-xs font-medium tracking-tight text-center leading-tight ${
                  isSelected
                    ? `${item.iconClass} font-semibold`
                    : 'text-ink-muted'
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
        <div className="mt-4 pt-3.5 border-t border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="text-xs text-ink-muted">
            {justSavedNotification ? (
              <span className="text-primary dark:text-primary font-medium flex items-center space-x-1">
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
            className="text-xs font-medium text-primary dark:text-primary hover:text-primary dark:hover:text-primary flex items-center space-x-1 py-1 px-2.5 rounded-lg bg-primary-soft dark:bg-primary-soft/40 hover:bg-primary-soft dark:hover:bg-primary-soft/80 transition"
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
        <p className="mt-3 text-xs text-ink-subtle text-center">
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
