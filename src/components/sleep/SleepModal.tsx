/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SleepEntry, SleepQuality } from '../../types';
import { useData } from '../../contexts/DataContext';
import { todayLocalDate } from '../../utils/date';
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
    const todayStr = initialData?.date || todayLocalDate();
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-scrim backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-raised rounded-t-3xl sm:rounded-3xl shadow-2xl border border-line max-h-[90vh] overflow-y-auto flex flex-col transition-colors animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-raised/95 dark:bg-raised/95 backdrop-blur-md px-6 py-4 border-b border-line flex items-center justify-between z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-info-soft dark:bg-info-soft/60 text-info dark:text-info">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-medium text-ink">
                Registro de Sono
              </h2>
              <p className="text-xs text-ink-muted">
                Como foi seu descanso na última noite?
              </p>
            </div>
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
          {/* Duration */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Duração estimada do sono
            </label>
            <div className="flex items-center space-x-4 bg-sunken p-4 rounded-2xl border border-line">
              <div className="flex-1">
                <span className="text-xs text-ink-muted block mb-1">Horas</span>
                <select
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-line dark:border-line-strong bg-raised text-sm font-medium text-ink"
                >
                  {Array.from({ length: 16 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i} horas
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <span className="text-xs text-ink-muted block mb-1">Minutos</span>
                <select
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-line dark:border-line-strong bg-raised text-sm font-medium text-ink"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-ink-muted text-center">
              Total registrado: <strong className="text-ink">{hours}h {minutes > 0 ? `${minutes}min` : ''}</strong>
            </p>
          </div>

          {/* Quality */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
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
                      ? 'bg-info-soft dark:bg-info-soft/40 border-info text-info dark:text-info ring-2 ring-info/20'
                      : 'border-line text-ink-muted hover:bg-sunken'
                  }`}
                >
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-[10px] text-ink-subtle mt-0.5 leading-tight">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Bedtime and Wake time */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Horários aproximados (opcional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-ink-muted block mb-1">Fui dormir por volta de</span>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-line dark:border-line-strong bg-raised text-sm text-ink"
                />
              </div>
              <div>
                <span className="text-[11px] text-ink-muted block mb-1">Acordei por volta de</span>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-line dark:border-line-strong bg-raised text-sm text-ink"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Observações (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Acordei uma vez para beber água, temperatura agradável..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-2xl border border-line bg-sunken text-sm text-ink placeholder-ink-subtle focus:outline-none focus:ring-2 focus:ring-info"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-sunken dark:bg-raised border-t border-line flex items-center justify-between">
          {initialData ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Excluir este registro de sono?')) {
                  deleteSleepEntry(initialData.id);
                  onClose();
                }
              }}
              className="p-2.5 text-ink-subtle hover:text-danger dark:hover:text-danger rounded-xl transition"
              title="Excluir sono"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : <div />}

          <div className="flex items-center space-x-3">
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
              className="py-2.5 px-6 rounded-2xl bg-info hover:bg-info/85 dark:bg-info text-on-primary font-medium text-sm flex items-center space-x-2 shadow-sm transition"
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
