/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SleepEntry, SleepQuality } from '../../types';
import { useData } from '../../contexts/DataContext';
import { X, Moon, Check, Trash2 } from 'lucide-react';

interface SleepModalProps {
  initialData: SleepEntry | null;
  onClose: () => void;
}

const QUALITY_LABELS: { value: SleepQuality; label: string; desc: string }[] = [
  { value: 1, label: 'Muito ruim', desc: 'Acordei exausto(a)' },
  { value: 2, label: 'Insuficiente', desc: 'Sono picado ou agitado' },
  { value: 3, label: 'Razoável', desc: 'Descanso moderado' },
  { value: 4, label: 'Bom', desc: 'Noite tranquila' },
  { value: 5, label: 'Reparador', desc: 'Totalmente descansado(a)' },
];

export const SleepModal: React.FC<SleepModalProps> = ({ initialData, onClose }) => {
  const { saveSleepEntry, deleteSleepEntry } = useData();

  const [hours, setHours] = useState<number>(() => {
    if (initialData?.durationMinutes) {
      return Math.floor(initialData.durationMinutes / 60);
    }
    return 7;
  });

  const [minutes, setMinutes] = useState<number>(() => {
    if (initialData?.durationMinutes) {
      return initialData.durationMinutes % 60;
    }
    return 30;
  });

  const [quality, setQuality] = useState<SleepQuality>(initialData?.perceivedQuality || 3);
  const [bedtime, setBedtime] = useState<string>(initialData?.bedtime || '23:00');
  const [wakeTime, setWakeTime] = useState<string>(initialData?.wakeTime || '07:00');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');

  const handleSave = () => {
    const todayStr = initialData?.date || new Date().toISOString().split('T')[0];
    const totalMinutes = hours * 60 + minutes;

    saveSleepEntry(
      {
        date: todayStr,
        durationMinutes: totalMinutes,
        perceivedQuality: quality,
        bedtime: bedtime || undefined,
        wakeTime: wakeTime || undefined,
        notes: notes.trim() || undefined,
      },
      initialData?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[90vh] overflow-y-auto flex flex-col transition-colors animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                Registro de Sono
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Como foi seu descanso na última noite?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Duration */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Duração estimada do sono
            </label>
            <div className="flex items-center space-x-4 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800">
              <div className="flex-1">
                <span className="text-xs text-stone-500 block mb-1">Horas</span>
                <select
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-medium text-stone-800 dark:text-stone-100"
                >
                  {Array.from({ length: 16 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i} horas
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <span className="text-xs text-stone-500 block mb-1">Minutos</span>
                <select
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-medium text-stone-800 dark:text-stone-100"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 text-center">
              Total registrado: <strong className="text-stone-800 dark:text-stone-200">{hours}h {minutes > 0 ? `${minutes}min` : ''}</strong>
            </p>
          </div>

          {/* Quality */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Qualidade percebida
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {QUALITY_LABELS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setQuality(item.value)}
                  className={`p-3 rounded-2xl border text-left sm:text-center transition ${
                    quality === item.value
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                  }`}
                >
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 leading-tight">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Bedtime and Wake time */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Horários aproximados (opcional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-stone-500 block mb-1">Fui dormir por volta de</span>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100"
                />
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block mb-1">Acordei por volta de</span>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Observações (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Acordei uma vez para beber água, temperatura agradável..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          {initialData ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Excluir este registro de sono?')) {
                  deleteSleepEntry(initialData.id);
                  onClose();
                }
              }}
              className="p-2.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition"
              title="Excluir sono"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : <div />}

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-stone-600 dark:text-stone-400 hover:text-stone-800 text-sm font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="py-2.5 px-6 rounded-2xl bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-medium text-sm flex items-center space-x-2 shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Sono</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
