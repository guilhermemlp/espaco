/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RecoveryActivityType } from '../../types';
import { useData } from '../../contexts/DataContext';
import { todayLocalDate } from '../../utils/date';
import { X, Check, Users, Sparkles, HeartHandshake, Smile, BookOpen } from 'lucide-react';

interface RecoveryActivityModalProps {
  periodId: string;
  onClose: () => void;
}

const ACTIVITY_TYPES: { type: RecoveryActivityType; label: string; icon: React.ReactNode }[] = [
  { type: 'reuniao', label: 'Reunião de Apoio', icon: <Users className="w-4 h-4" /> },
  { type: 'meditacao', label: 'Meditação / Atenção Plena', icon: <Sparkles className="w-4 h-4" /> },
  { type: 'pratica_espiritual', label: 'Prática Espiritual', icon: <HeartHandshake className="w-4 h-4" /> },
  { type: 'gratidao', label: 'Momento de Gratidão', icon: <Smile className="w-4 h-4" /> },
  { type: 'reflexao', label: 'Reflexão Pessoal', icon: <BookOpen className="w-4 h-4" /> },
];

export const RecoveryActivityModal: React.FC<RecoveryActivityModalProps> = ({ periodId, onClose }) => {
  const { saveRecoveryActivity } = useData();

  const [type, setType] = useState<RecoveryActivityType>('reuniao');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(todayLocalDate());

  const handleSave = () => {
    if (!title.trim()) return;

    saveRecoveryActivity({
      periodId,
      type,
      title: title.trim(),
      notes: notes.trim() || undefined,
      date,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-raised rounded-3xl shadow-2xl border border-line p-6 space-y-5 animate-slideUp">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-lg font-serif font-medium text-ink">
            Registrar Prática ou Apoio
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-subtle hover:text-ink hover:bg-sunken-strong transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-2">
              Tipo de atividade
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACTIVITY_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setType(t.type)}
                  className={`p-2.5 rounded-2xl border text-xs font-medium flex items-center space-x-2 transition ${
                    type === t.type
                      ? 'bg-accent-soft dark:bg-accent-soft/40 border-accent text-accent dark:text-accent ring-2 ring-accent/20'
                      : 'border-line text-ink-muted hover:bg-sunken'
                  }`}
                >
                  <span className="text-accent dark:text-accent">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-1">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-line dark:border-line-strong bg-sunken text-xs text-ink"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-1">
              Descrição breve
            </label>
            <input
              type="text"
              placeholder="Ex: Reunião do grupo local, 15 min de respiração..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-line bg-sunken text-sm text-ink placeholder-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-1">
              Anotações adicionais (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Como você se sentiu durante essa prática?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-line bg-sunken text-xs text-ink placeholder-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-ink-muted hover:text-ink text-sm font-medium transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!title.trim()}
            onClick={handleSave}
            className="py-2.5 px-6 rounded-2xl bg-accent hover:bg-accent-hover dark:bg-accent disabled:opacity-50 text-on-primary font-medium text-sm flex items-center space-x-2 shadow-sm transition"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Atividade</span>
          </button>
        </div>
      </div>
    </div>
  );
};
