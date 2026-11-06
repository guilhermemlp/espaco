/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { LineChart, Calendar, Info, Moon, Flame, Heart, AlertCircle } from 'lucide-react';
import { MOOD_LEVELS } from '../checkin/QuickMoodSelector';

type PeriodFilter = 7 | 30 | 90 | 365;

export const InsightsView: React.FC = () => {
  const { checkIns, sleepEntries, behaviorEntries, categories } = useData();
  const [periodDays, setPeriodDays] = useState<PeriodFilter>(30);

  // Filter data within timeframe
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

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

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Header & Period selector */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100 flex items-center space-x-2">
              <LineChart className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <span>Observações & Padrões</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Visualizações descritivas do seu caminho, sem metas ou julgamento.
            </p>
          </div>

          {/* Period selector */}
          <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 shrink-0">
            {([7, 30, 90] as PeriodFilter[]).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setPeriodDays(days)}
                className={`py-1.5 px-3 rounded-xl text-xs font-medium transition ${
                  periodDays === days
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                {days} dias
              </button>
            ))}
          </div>
        </div>

        {/* Exploratory disclaimer notice */}
        <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/50 dark:border-stone-700/50 flex items-start space-x-2.5 text-xs text-stone-500 dark:text-stone-400">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Estes gráficos refletem apenas os momentos que você optou por registrar. Dias sem dados são naturais e não indicam falha ou sucesso.
          </span>
        </div>
      </div>

      {/* CHART 1: Mood over time */}
      <div className="bg-white dark:bg-stone-900 p-5 md:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Humor ao longo do período
            </h3>
          </div>
          <span className="text-xs text-stone-400">Escala de 1 a 5</span>
        </div>

        {filteredCheckIns.length < 2 ? (
          <div className="py-10 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-stone-300 dark:text-stone-600 mx-auto" />
            <p className="text-xs text-stone-500 dark:text-stone-400">
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
                  stroke="#059669"
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
                      className="fill-emerald-600 stroke-white dark:stroke-stone-900 stroke-2"
                    />
                  );
                })}
              </svg>
            </div>

            {/* X-axis date range labels */}
            <div className="flex justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800">
              <span>{formatShortDate(filteredCheckIns[0].date)}</span>
              <span>{formatShortDate(filteredCheckIns[filteredCheckIns.length - 1].date)}</span>
            </div>
          </div>
        )}

        {/* Transparency footer */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap items-center justify-between text-[11px] text-stone-400">
          <span>Baseado em {filteredCheckIns.length} check-ins</span>
          <span>{missingCheckInDays} dias sem registro nos últimos {periodDays} dias</span>
        </div>
      </div>

      {/* CHART 2: Energy & Anxiety */}
      <div className="bg-white dark:bg-stone-900 p-5 md:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Energia e Ansiedade observadas
          </h3>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-stone-600 dark:text-stone-400">Energia</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span className="text-stone-600 dark:text-stone-400">Ansiedade</span>
            </span>
          </div>
        </div>

        {filteredCheckIns.filter(c => c.energy || c.anxiety).length < 2 ? (
          <div className="py-8 text-center space-y-1">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Sem dados suficientes de energia ou ansiedade neste período.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-full h-36 relative flex items-end pt-4 pb-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                {/* Energy line */}
                {filteredCheckIns.some(c => c.energy) && (
                  <path
                    d={filteredCheckIns.map((item, idx) => {
                      const x = (idx / Math.max(1, filteredCheckIns.length - 1)) * 380 + 10;
                      const y = 100 - ((item.energy || 3) / 5) * 80 - 10;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* Anxiety line */}
                {filteredCheckIns.some(c => c.anxiety) && (
                  <path
                    d={filteredCheckIns.map((item, idx) => {
                      const x = (idx / Math.max(1, filteredCheckIns.length - 1)) * 380 + 10;
                      const y = 100 - ((item.anxiety || 3) / 5) * 80 - 10;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#14B8A6"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </div>
            <p className="text-[11px] text-stone-400 text-center">
              Tendências visuais para auto-observação, sem afirmação de causalidade.
            </p>
          </div>
        )}
      </div>

      {/* CHART 3: Sleep */}
      <div className="bg-white dark:bg-stone-900 p-5 md:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Repouso & Duração de Sono
            </h3>
          </div>
          <span className="text-xs text-stone-400">Em horas</span>
        </div>

        {filteredSleep.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
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
                      className="w-full max-w-[28px] rounded-t-lg bg-indigo-200 dark:bg-indigo-900/60 hover:bg-indigo-400 transition relative"
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[9px] py-0.5 px-1 rounded transition whitespace-nowrap z-10">
                        {hours.toFixed(1)}h
                      </span>
                    </div>
                    <span className="text-[9px] text-stone-400 mt-1 truncate w-full text-center">
                      {formatShortDate(s.date)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
              <span>{filteredSleep.length} noites registradas</span>
              <span>{missingSleepDays} noites sem registro</span>
            </div>
          </div>
        )}
      </div>

      {/* CHART 4: Impulses by Category */}
      <div className="bg-white dark:bg-stone-900 p-5 md:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Frequência de Impulsos Observados
          </h3>
        </div>

        {filteredBehaviors.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
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
                <div key={cat.id} className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-800 dark:text-stone-200">{cat.name}</span>
                    <span className="text-stone-500 dark:text-stone-400">
                      {occurrences.length} {occurrences.length === 1 ? 'registro' : 'registros'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>Intensidade média do impulso: <strong className="text-rose-600 dark:text-rose-400">{avgIntensity}/10</strong></span>
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
