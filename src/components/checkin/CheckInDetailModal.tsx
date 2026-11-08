/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckIn, MoodLevel, EnergyLevel, AnxietyLevel } from '../../types';
import { useData } from '../../contexts/DataContext';
import { todayLocalDate } from '../../utils/date';
import { X, Check } from 'lucide-react';
import { MOOD_LEVELS } from './QuickMoodSelector';

interface CheckInDetailModalProps {
  initialData: CheckIn | null;
  onClose: () => void;
}

const COMMON_EMOTIONS = [
  'Calma',
  'Gratidão',
  'Alegria',
  'Alívio',
  'Esperança',
  'Clareza',
  'Foco',
  'Cansaço',
  'Sobrecarga',
  'Tristeza',
  'Irritação',
  'Ansiedade',
  'Medo',
  'Insegurança',
  'Solidão',
  'Confusão',
  'Não sei identificar',
  'Prefiro não responder',
];

export const CheckInDetailModal: React.FC<CheckInDetailModalProps> = ({ initialData, onClose }) => {
  const { saveCheckIn } = useData();

  const [mood, setMood] = useState<MoodLevel>(initialData?.mood || 3);
  const [energy, setEnergy] = useState<EnergyLevel | null>(initialData?.energy ?? null);
  const [anxiety, setAnxiety] = useState<AnxietyLevel | null>(initialData?.anxiety ?? null);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(initialData?.emotions || []);
  const [note, setNote] = useState<string>(initialData?.note || '');

  const toggleEmotion = (emotion: string) => {
    if (emotion === 'Não sei identificar' || emotion === 'Prefiro não responder') {
      setSelectedEmotions([emotion]);
      return;
    }

    const filtered = selectedEmotions.filter(
      e => e !== 'Não sei identificar' && e !== 'Prefiro não responder'
    );

    if (filtered.includes(emotion)) {
      setSelectedEmotions(filtered.filter(e => e !== emotion));
    } else {
      setSelectedEmotions([...filtered, emotion]);
    }
  };

  const handleSave = () => {
    const todayStr = initialData?.date || todayLocalDate();
    const timeStr = initialData?.time || new Date().toTimeString().slice(0, 5);

    saveCheckIn(
      {
        date: todayStr,
        time: timeStr,
        mood,
        energy,
        anxiety,
        emotions: selectedEmotions,
        note: note.trim(),
      },
      initialData?.id
    );

    onClose();
  };

  const energyLabels = ['Muito baixa', 'Baixa', 'Moderada', 'Alta', 'Muito alta'];
  const anxietyLabels = ['Muito baixa', 'Baixa', 'Moderada', 'Alta', 'Muito alta'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-scrim backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-raised rounded-t-3xl sm:rounded-3xl shadow-2xl border border-line max-h-[90vh] overflow-y-auto flex flex-col transition-colors animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-raised/95 dark:bg-raised/95 backdrop-blur-md px-6 py-4 border-b border-line flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-serif font-medium text-ink">
              Detalhes do seu momento
            </h2>
            <p className="text-xs text-ink-muted">
              Tudo aqui é opcional. Preencha apenas o que fizer sentido para você.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-ink-subtle hover:text-ink hover:bg-sunken-strong transition"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Mood adjustment */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Humor geral
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {MOOD_LEVELS.map(item => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setMood(item.level)}
                  className={`py-2 px-1 rounded-xl text-xs font-medium border flex flex-col items-center justify-center transition ${
                    mood === item.level
                      ? `${item.softClass} ${item.borderClass} ${item.iconClass} font-semibold`
                      : `border-line text-ink-muted ${item.hoverClass}`
                  }`}
                >
                  <span className={`text-sm ${item.iconClass}`}>{item.icon}</span>
                  <span className="text-[10px] mt-1">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Nível de Energia
              </label>
              <span className="text-xs text-ink-muted">
                {energy ? energyLabels[energy - 1] : 'Não informado'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setEnergy(energy === lvl ? null : (lvl as EnergyLevel))}
                  className={`py-2 rounded-xl text-xs font-medium border transition ${
                    energy === lvl
                      ? 'bg-warning-soft dark:bg-warning-soft/40 border-warning text-warning dark:text-warning font-semibold'
                      : 'border-line text-ink-muted hover:bg-sunken'
                  }`}
                >
                  {lvl} - {energyLabels[lvl - 1].split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Anxiety level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Nível de Ansiedade
              </label>
              <span className="text-xs text-ink-muted">
                {anxiety ? anxietyLabels[anxiety - 1] : 'Não informado'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setAnxiety(anxiety === lvl ? null : (lvl as AnxietyLevel))}
                  className={`py-2 rounded-xl text-xs font-medium border transition ${
                    anxiety === lvl
                      ? 'bg-accent-soft dark:bg-accent-soft/40 border-accent text-accent dark:text-accent font-semibold'
                      : 'border-line text-ink-muted hover:bg-sunken'
                  }`}
                >
                  {lvl} - {anxietyLabels[lvl - 1].split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Emotions chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Emoções presentes
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_EMOTIONS.map(em => {
                const isSelected = selectedEmotions.includes(em);
                const isNeutralChoice = em === 'Não sei identificar' || em === 'Prefiro não responder';
                return (
                  <button
                    key={em}
                    type="button"
                    onClick={() => toggleEmotion(em)}
                    className={`py-1.5 px-3 rounded-full text-xs transition ${
                      isSelected
                        ? isNeutralChoice
                          ? 'bg-ink text-surface font-medium'
                          : 'bg-primary text-on-primary dark:bg-primary font-medium shadow-xs'
                        : 'bg-sunken text-ink-muted hover:bg-sunken-strong border border-line/60 dark:border-line-strong/60'
                    }`}
                  >
                    {em}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Short note */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Observação curta (opcional)
            </label>
            <textarea
              rows={2}
              maxLength={280}
              placeholder="O que está acontecendo ao seu redor neste momento?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 rounded-2xl border border-line bg-sunken text-sm text-ink placeholder-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-[11px] text-ink-subtle text-right">{note.length}/280</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-sunken dark:bg-raised border-t border-line flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-ink-muted hover:text-ink text-sm font-medium transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="py-2.5 px-6 rounded-2xl bg-primary hover:bg-primary-hover dark:bg-primary text-on-primary font-medium text-sm flex items-center space-x-2 shadow-sm transition"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Detalhes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
