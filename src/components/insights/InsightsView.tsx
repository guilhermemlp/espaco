/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { CheckIn } from '../../types';
import { windowStartDate } from '../../utils/date';
import { LineChart, Info, Moon, Flame, Heart, AlertCircle } from 'lucide-react';

type PeriodFilter = 7 | 30 | 90 | 365;

export const InsightsView: React.FC = () => {
  const { checkIns, sleepEntries, behaviorEntries, categories } = useData();
  const [periodDays, setPeriodDays] = useState<PeriodFilter>(30);

  // Janela que termina hoje, no fuso local do dispositivo.
  const cutoffStr = windowStartDate(periodDays);

  const filteredCheckIns = checkIns
    .filter(c => c.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const filteredSleep = sleepEntries
    .filter(s => s.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const filteredBehaviors = behaviorEntries
    .filter(b => b.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate distinct recorded dates for gap transparency
  const distinctCheckInDates = new Set(filteredCheckIns.map(c => c.date)).size;
  const missingCheckInDays = Math.max(0, periodDays - distinctCheckInDates);

  const distinctSleepDates = new Set(filteredSleep.map(s => s.date)).size;
  const missingSleepDays = Math.max(0, periodDays - distinctSleepDates);

  // Format date helper
  const formatShortDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      return `${parts[2]}/${parts[1]}`;
    } catch {
      return dateStr;
    }
  };

  /**
   * Monta o caminho SVG de uma série sem imputar valores ausentes.
   * Quando falta um registro, a linha é interrompida (começa novo "M").
   */
  const buildSeriesPath = (
    items: CheckIn[],
    getValue: (item: CheckIn) => number | null | undefined,
    height: number,
  ) => {
    let started = false;
    return items
      .map((item, index) => {
        const value = getValue(item);
        if (value == null) {
          started = false;
          return '';
        }

        const x = (index / Math.max(1, items.length - 1)) * 380 + 10;
        const y = height - (value / 5) * (height - 20) - 10;
        const command = started ? 'L' : 'M';
        started = true;
        return `${command} ${x} ${y}`;
      })
      .filter(Boolean)
      .join(' ');
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Header & Period selector */}
      <div className="bg-raised p-5 rounded-3xl border border-line shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-serif font-medium text-ink flex items-center space-x-2">
              <LineChart className="w-5 h-5 text-primary dark:text-primary" />
              <span>Observações & Padrões</span>
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Visualizações descritivas do seu caminho, sem metas ou julgamento.
            </p>
          </div>

          {/* Period selector */}
          <div className="flex bg-sunken p-1 rounded-2xl border border-line/60 dark:border-line-strong/60 shrink-0">
            {([7, 30, 90] as PeriodFilter[]).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setPeriodDays(days)}
                className={`py-1.5 px-3 rounded-xl text-xs font-medium transition ${
                  periodDays === days
                    ? 'bg-raised text-ink shadow-xs'
                    : 'text-ink-muted hover:text-ink dark:hover:text-stone-200'
                }`}
              >
                {days} dias
              </button>
            ))}
          </div>
        </div>

        {/* Exploratory disclaimer notice */}
        <div className="p-3 bg-sunken rounded-2xl border border-line/50 dark:border-line-strong/50 flex items-start space-x-2.5 text-xs text-ink-muted">
          <Info className="w-4 h-4 text-primary dark:text-primary shrink-0 mt-0.5" />
          <span>
            Estes gráficos refletem apenas os momentos que você optou por registrar. Dias sem dados são naturais e não indicam falha ou sucesso.
          </span>
        </div>
      </div>

      {/* CHART 1: Mood over time */}
      <div className="bg-raised p-5 md:p-6 rounded-3xl border border-line shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 text-primary dark:text-primary" />
            <h3 className="text-sm font-semibold text-ink">
              Humor ao longo do período
            </h3>
          </div>
          <span className="text-xs text-ink-subtle">Escala de 1 a 5</span>
        </div>

        {filteredCheckIns.length < 2 ? (
          <div className="py-10 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-stone-300 dark:text-ink-muted mx-auto" />
            <p className="text-xs text-ink-muted">
              Ainda não há registros suficientes para mostrar tendências neste período.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* SVG Visual */}
            <div className="w-full h-44 relative flex items-end pt-6 pb-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                {/* Horizontal reference guidelines */}
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const y = 120 - (lvl / 5) * 100 - 10;
                  return (
                    <line
                      key={lvl}
                      x1="0"
                      y1={y}
                      x2="400"
                      y2={y}
                      stroke="currentColor"
                      strokeDasharray="2 3"
                      className="text-stone-200 dark:text-stone-800"
                    />
                  );
                })}

                {/* Line path */}
                <path
                  d={filteredCheckIns.map((item, idx) => {
                    const x = (idx / Math.max(1, filteredCheckIns.length - 1)) * 380 + 10;
                    const y = 120 - (item.mood / 5) * 100 - 10;
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="var(--chart-mood)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data dots */}
                {filteredCheckIns.map((item, idx) => {
                  const x = (idx / Math.max(1, filteredCheckIns.length - 1)) * 380 + 10;
                  const y = 120 - (item.mood / 5) * 100 - 10;
                  return (
                    <circle
                      key={item.id}
                      cx={x}
                      cy={y}
                      r="4.5"
                      className="fill-primary stroke-white dark:stroke-stone-900 stroke-2"
                    />
                  );
                })}
              </svg>
            </div>

            {/* X-axis date range labels */}
            <div className="flex justify-between text-[11px] text-ink-subtle pt-1 border-t border-line">
              <span>{formatShortDate(filteredCheckIns[0].date)}</span>
              <span>{formatShortDate(filteredCheckIns[filteredCheckIns.length - 1].date)}</span>
            </div>
          </div>
        )}

        {/* Transparency footer */}
        <div className="pt-2 border-t border-line flex flex-wrap items-center justify-between text-[11px] text-ink-subtle">
          <span>Baseado em {filteredCheckIns.length} check-ins</span>
          <span>{missingCheckInDays} dias sem registro nos últimos {periodDays} dias</span>
        </div>
      </div>

      {/* CHART 2: Energy & Anxiety */}
      <div className="bg-raised p-5 md:p-6 rounded-3xl border border-line shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">
            Energia e Ansiedade observadas
          </h3>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-warning" />
              <span className="text-ink-muted">Energia</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="text-ink-muted">Ansiedade</span>
            </span>
          </div>
        </div>

        {filteredCheckIns.filter(c => c.energy != null || c.anxiety != null).length < 2 ? (
          <div className="py-8 text-center space-y-1">
            <p className="text-xs text-ink-muted">
              Sem dados suficientes de energia ou ansiedade neste período.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-full h-36 relative flex items-end pt-4 pb-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                {/* Energy line */}
                {filteredCheckIns.some(c => c.energy != null) && (
                  <path
                    d={buildSeriesPath(filteredCheckIns, (item) => item.energy, 100)}
                    fill="none"
                    stroke="var(--chart-energy)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* Anxiety line */}
                {filteredCheckIns.some(c => c.anxiety != null) && (
                  <path
                    d={buildSeriesPath(filteredCheckIns, (item) => item.anxiety, 100)}
                    fill="none"
                    stroke="var(--chart-anxiety)"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </div>
            <p className="text-[11px] text-ink-subtle text-center">
              Tendências visuais para auto-observação, sem afirmação de causalidade.
            </p>
          </div>
        )}
      </div>

      {/* CHART 3: Sleep */}
      <div className="bg-raised p-5 md:p-6 rounded-3xl border border-line shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Moon className="w-4 h-4 text-info dark:text-info" />
            <h3 className="text-sm font-semibold text-ink">
              Repouso & Duração de Sono
            </h3>
          </div>
          <span className="text-xs text-ink-subtle">Em horas</span>
        </div>

        {filteredSleep.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-muted">
            Nenhum registro de sono no período selecionado.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 items-end h-28 pt-2">
              {filteredSleep.slice(-10).map((s) => {
                const hours = s.durationMinutes / 60;
                const heightPct = Math.min(100, Math.max(15, (hours / 12) * 100));
                return (
                  <div key={s.id} className="flex flex-col items-center h-full justify-end group">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[28px] rounded-t-lg bg-info/20 dark:bg-info/60 hover:bg-info transition relative"
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[9px] py-0.5 px-1 rounded transition whitespace-nowrap z-10">
                        {hours.toFixed(1)}h
                      </span>
                    </div>
                    <span className="text-[9px] text-ink-subtle mt-1 truncate w-full text-center">
                      {formatShortDate(s.date)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-line flex items-center justify-between text-[11px] text-ink-subtle">
              <span>{filteredSleep.length} noites registradas</span>
              <span>{missingSleepDays} noites sem registro</span>
            </div>
          </div>
        )}
      </div>

      {/* CHART 4: Impulses by Category */}
      <div className="bg-raised p-5 md:p-6 rounded-3xl border border-line shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Flame className="w-4 h-4 text-danger dark:text-danger" />
          <h3 className="text-sm font-semibold text-ink">
            Frequência de Impulsos Observados
          </h3>
        </div>

        {filteredBehaviors.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-muted">
            Nenhum impulso registrado no período selecionado.
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => {
              const occurrences = filteredBehaviors.filter(b => b.categoryId === cat.id);
              if (occurrences.length === 0) return null;

              const avgIntensity = (
                occurrences.reduce((sum, b) => sum + b.urgeIntensity, 0) / occurrences.length
              ).toFixed(1);

              return (
                <div key={cat.id} className="p-3 rounded-2xl bg-sunken border border-line space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{cat.name}</span>
                    <span className="text-ink-muted">
                      {occurrences.length} {occurrences.length === 1 ? 'registro' : 'registros'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-ink-subtle">
                    <span>Intensidade média do impulso: <strong className="text-danger dark:text-danger">{avgIntensity}/10</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
