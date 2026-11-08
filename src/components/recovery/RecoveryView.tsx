/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Tela Minha Jornada de Recuperação.
 * Foco estrito em recuperação sem competição:
 * 1. Contagem de dias acolhedora e respeitosa
 * 2. Meditação Diária de Narcóticos Anônimos (NA Brasil - Só Por Hoje)
 * 3. Marcos de tempo
 * 4. Histórico de períodos anteriores preservados
 */

import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { 
  Compass, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  RotateCcw, 
  History, 
  ShieldCheck 
} from 'lucide-react';
import { NAMeditationCard } from './NAMeditationCard';
import { todayLocalDate } from '../../utils/date';

interface RecoveryViewProps {
  onReflectInJournal: (reflection: { tag: 'reflexao'; title: string; content: string }) => void;
}

export const RecoveryView: React.FC<RecoveryViewProps> = ({ onReflectInJournal }) => {
  const { 
    activeRecoveryPeriod, 
    recoveryPeriods, 
    saveRecoveryPeriod, 
    restartRecoveryPeriod, 
    calculateRecoveryDays, 
    calculateFormattedDuration,
    getRecoveryMilestones
  } = useData();

  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // New period setup form
  const [newLabel, setNewLabel] = useState('Minha jornada de serenidade');
  const [newStartDate, setNewStartDate] = useState(todayLocalDate());
  const [newNotes, setNewNotes] = useState('');

  const previousPeriods = recoveryPeriods.filter(p => !p.isActive);

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      return new Intl.DateTimeFormat('pt-BR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  if (!activeRecoveryPeriod) {
    return (
      <div className="space-y-6 pb-20 animate-fadeIn">
        <div className="bg-raised p-6 md:p-8 rounded-3xl border border-line shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-soft dark:bg-accent-soft/60 text-accent dark:text-accent flex items-center justify-center mx-auto shadow-inner">
            <Compass className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-serif font-medium text-ink">
              Minha Jornada de Recuperação
            </h2>
            <p className="text-xs md:text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
              Um espaço silencioso e compassivo para celebrar cada dia de presença, sem cobrança de perfeição.
            </p>
          </div>

          <div className="space-y-3 pt-4 text-left max-w-sm mx-auto">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-1">
                Nome ou propósito desta jornada
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: Só por hoje, Sem álcool, Serenidade..."
                className="w-full p-2.5 rounded-xl border border-line dark:border-line-strong bg-sunken text-sm text-ink"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-1">
                Data de início
              </label>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-line dark:border-line-strong bg-sunken text-sm text-ink"
              />
            </div>

            <button
              type="button"
              onClick={() => saveRecoveryPeriod(newLabel, newStartDate, newNotes)}
              className="w-full py-3 px-6 rounded-2xl bg-accent hover:bg-accent-hover dark:bg-accent text-on-primary font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>Iniciar Acompanhamento</span>
            </button>
          </div>
        </div>

        {/* Daily NA Meditation still available to read even before setting a period */}
        <NAMeditationCard onReflectInJournal={onReflectInJournal} />

        {previousPeriods.length > 0 && (
          <div className="bg-raised p-5 rounded-3xl border border-line space-y-3">
            <h3 className="text-sm font-semibold text-ink-muted">
              Períodos Anteriores Registrados
            </h3>
            <div className="space-y-2">
              {previousPeriods.map(p => (
                <div key={p.id} className="p-3 rounded-2xl bg-sunken text-xs text-ink-muted flex items-center justify-between">
                  <span>{p.label}</span>
                  <span>{formatDate(p.startDate)} {p.endDate ? `até ${formatDate(p.endDate)}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const days = calculateRecoveryDays(activeRecoveryPeriod.startDate);
  const formattedDuration = calculateFormattedDuration(activeRecoveryPeriod.startDate);
  const milestones = getRecoveryMilestones(activeRecoveryPeriod);

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* 1. Top Dual Counter Card */}
      <div className="bg-gradient-to-b from-accent/70 to-primary/40 dark:from-raised dark:to-raised/90 p-6 md:p-8 rounded-3xl border border-accent/25 dark:border-line shadow-sm text-center relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="text-xs font-semibold tracking-wider uppercase text-accent dark:text-accent bg-accent-soft/80 dark:bg-accent-soft/80 py-1 px-3 rounded-full inline-block">
            {activeRecoveryPeriod.label}
          </span>

          <div className="py-2">
            <div className="text-4xl md:text-5xl font-serif font-medium text-ink tracking-tight">
              {days} {days === 1 ? 'dia' : 'dias'}
            </div>
            <div className="text-sm md:text-base text-ink-muted font-medium mt-1">
              {formattedDuration}
            </div>
          </div>

          <div className="flex items-center justify-center space-x-1.5 text-xs text-ink-muted pt-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Início em {formatDate(activeRecoveryPeriod.startDate)}</span>
          </div>
        </div>

        {/* Action to restart cycle gently */}
        <div className="flex items-center justify-center pt-4 relative z-10">
          <button
            type="button"
            onClick={() => setShowRestartModal(true)}
            className="py-2 px-3.5 rounded-2xl border border-line-strong text-ink-muted hover:bg-sunken-strong text-xs font-medium flex items-center space-x-1.5 transition"
            title="Recomeçar ciclo com preservação do histórico"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Iniciar novo ciclo</span>
          </button>
        </div>
      </div>

      {/* 2. Meditação Diária de Narcóticos Anônimos (NA Brasil) */}
      <NAMeditationCard onReflectInJournal={onReflectInJournal} />

      {/* 3. Marcos de Tempo (Sem contagem regressiva punitiva) */}
      <div className="bg-raised p-5 md:p-6 rounded-3xl border border-line shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-serif font-medium text-ink">
            Marcos de Tempo
          </h3>
          <p className="text-xs text-ink-muted">
            Reconhecimento do caminho percorrido, sem pressa nem contagem regressiva.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {milestones.map((m) => (
            <div
              key={m.days}
              className={`p-3 rounded-2xl border transition flex items-center space-x-2.5 ${
                m.achieved
                  ? 'bg-primary-soft/70 dark:bg-primary-soft/30 border-primary/25 dark:border-primary/25 text-primary dark:text-primary'
                  : 'bg-sunken border-line text-ink-subtle dark:text-ink-muted'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  m.achieved
                    ? 'bg-primary text-on-primary'
                    : 'border border-line-strong bg-sunken'
                }`}
              >
                {m.achieved ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-line-strong dark:bg-line-strong" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{m.title}</p>
                <p className="text-[10px] opacity-75">{m.days} dias</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Histórico de Períodos Anteriores */}
      {previousPeriods.length > 0 && (
        <div className="bg-raised p-5 rounded-3xl border border-line shadow-xs space-y-3">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-ink-subtle" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Histórico de Períodos Anteriores ({previousPeriods.length})
              </h3>
            </div>
            <span className="text-xs text-ink-subtle">{showHistory ? 'Ocultar' : 'Ver todos'}</span>
          </button>

          {showHistory && (
            <div className="space-y-2 pt-2 border-t border-line">
              <p className="text-xs text-ink-muted">
                Cada período representa tempo e dedicação reais. O histórico é sempre preservado com carinho e respeito.
              </p>
              {previousPeriods.map((p) => {
                const pastDays = calculateRecoveryDays(p.startDate, p.endDate);
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-sunken border border-line text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-ink">{p.label}</p>
                      <p className="text-[11px] text-ink-subtle">
                        {formatDate(p.startDate)} {p.endDate ? `até ${formatDate(p.endDate)}` : ''}
                      </p>
                    </div>
                    <span className="font-semibold text-ink-muted">
                      {pastDays} dias vividos
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Gentle Restart Modal */}
      {showRestartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-raised rounded-3xl shadow-2xl border border-line p-6 space-y-4 animate-slideUp">
            <div className="flex items-center space-x-2 text-accent dark:text-accent">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-base font-serif font-medium text-ink">
                Iniciar um novo ciclo de presença
              </h3>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              Deseja encerrar o ciclo atual e começar um novo?
            </p>

            <div className="p-3 bg-accent-soft dark:bg-accent-soft/40 rounded-2xl text-xs text-accent dark:text-accent border border-accent/25 dark:border-accent/25">
              <strong>Seu histórico continuará guardado:</strong> Os {days} dias deste ciclo serão preservados no seu histórico pessoal. Recuperação é um caminho contínuo de aprendizado, não uma competição ou fracasso.
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                  Nome do novo ciclo
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-line dark:border-line-strong bg-sunken text-xs text-ink"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                  Data de início
                </label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-line dark:border-line-strong bg-sunken text-xs text-ink"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setShowRestartModal(false)}
                className="py-2.5 px-4 rounded-xl text-ink-muted text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  restartRecoveryPeriod(newLabel, newStartDate);
                  setShowRestartModal(false);
                }}
                className="py-2.5 px-5 rounded-2xl bg-accent hover:bg-accent-hover text-on-primary text-xs font-medium shadow-sm transition"
              >
                Confirmar e Iniciar Novo Ciclo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
