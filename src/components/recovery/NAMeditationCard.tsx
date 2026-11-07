/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Card de Meditação Diária de Narcóticos Anônimos (NA Brasil).
 * Coleta diariamente a meditação oficial de https://www.na.org.br/meditacao/
 */

import React, { useState, useEffect } from 'react';
import { NAMeditation } from '../../types';
import { todayLocalDate } from '../../utils/date';
import { 
  Sparkles, 
  ExternalLink, 
  BookOpen, 
  RefreshCw, 
  Quote, 
  Heart,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface NAMeditationCardProps {
  onReflectInJournal: (reflection: { tag: 'reflexao'; title: string; content: string }) => void;
}

const LOCAL_CACHE_KEY = 'espaco_na_meditation_cache';

export const NAMeditationCard: React.FC<NAMeditationCardProps> = ({ onReflectInJournal }) => {
  const [meditation, setMeditation] = useState<NAMeditation | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const todayStr = todayLocalDate();
        if (parsed.cachedDate === todayStr && parsed.data) {
          return parsed.data;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(!meditation);
  const [error, setError] = useState<string | null>(null);

  const fetchMeditation = async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/meditacao');
      if (!res.ok) {
        throw new Error('Não foi possível carregar a meditação no momento.');
      }

      const data: NAMeditation = await res.json();
      setMeditation(data);

      // Cache locally
      const todayStr = todayLocalDate();
      localStorage.setItem(
        LOCAL_CACHE_KEY,
        JSON.stringify({ cachedDate: todayStr, data })
      );
    } catch (err: any) {
      console.warn('Erro ao buscar meditação diária:', err);
      setError(err?.message || 'Falha temporária ao conectar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!meditation) {
      fetchMeditation();
    }
  }, []);

  const handleReflectClick = () => {
    if (!meditation) return;
    onReflectInJournal({
      tag: 'reflexao',
      title: `Reflexão: ${meditation.title}`,
      content: `“${meditation.quote}”\n— ${meditation.source}\n\nSó por hoje: ${meditation.justForToday}\n\nMinha reflexão:\n`,
    });
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden transition-all">
      {/* Top Header */}
      <div className="px-5 md:px-6 pt-5 pb-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-teal-800 dark:text-teal-400">
                Meditação Diária
              </span>
              <span className="text-[10px] text-stone-400">• Narcóticos Anônimos</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>{meditation?.date || 'Hoje'}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchMeditation(true)}
          disabled={loading}
          className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition disabled:opacity-50"
          title="Atualizar meditação"
          aria-label="Atualizar meditação do dia"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Body content */}
      <div className="p-5 md:p-6 space-y-4">
        {loading && !meditation ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Coletando a meditação do dia de na.org.br...
            </p>
          </div>
        ) : error && !meditation ? (
          <div className="py-6 text-center space-y-3">
            <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
            <p className="text-xs text-stone-600 dark:text-stone-300 max-w-xs mx-auto">
              Não foi possível sincronizar no momento. Você pode tentar novamente ou acessar diretamente o site.
            </p>
            <div className="flex items-center justify-center space-x-3 pt-1">
              <button
                type="button"
                onClick={() => fetchMeditation(true)}
                className="py-1.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-medium text-stone-700 dark:text-stone-300"
              >
                Tentar novamente
              </button>
              <a
                href="https://www.na.org.br/meditacao/"
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-medium text-teal-700 dark:text-teal-400 flex items-center space-x-1"
              >
                <span>Abrir na.org.br</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : meditation ? (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <h3 className="text-lg md:text-xl font-serif font-medium text-stone-900 dark:text-stone-50 leading-snug">
                {meditation.title}
              </h3>
            </div>

            {/* Opening Quote & Citation */}
            {meditation.quote && (
              <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 relative">
                <Quote className="w-4 h-4 text-teal-600/60 dark:text-teal-400/60 mb-1" />
                <p className="text-xs md:text-sm font-medium italic text-stone-800 dark:text-stone-200 leading-relaxed">
                  {meditation.quote}
                </p>
                {meditation.source && (
                  <p className="text-[11px] text-teal-800 dark:text-teal-400 font-semibold mt-2 text-right">
                    — {meditation.source}
                  </p>
                )}
              </div>
            )}

            {/* Meditation Body Text */}
            <div className="space-y-3 text-xs md:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
              {meditation.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* 'Só por hoje' Block */}
            {meditation.justForToday && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/80 dark:border-emerald-800/80 space-y-1.5 shadow-2xs">
                <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  <Heart className="w-3.5 h-3.5 fill-emerald-600 dark:fill-emerald-400 text-emerald-600 dark:text-emerald-400" />
                  <span>Só por hoje</span>
                </div>
                <p className="text-xs md:text-sm text-stone-800 dark:text-stone-100 font-medium leading-relaxed">
                  {meditation.justForToday}
                </p>
              </div>
            )}

            {/* Attribution */}
            <p className="text-[10px] text-stone-400 text-center pt-1">
              {meditation.copyright}
            </p>
          </div>
        ) : null}
      </div>

      {/* Card Actions */}
      {meditation && (
        <div className="px-5 md:px-6 py-3.5 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <a
            href={meditation.sourceUrl || 'https://www.na.org.br/meditacao/'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 flex items-center space-x-1 transition order-2 sm:order-1"
          >
            <span>Ver no site oficial da NA</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={handleReflectClick}
            className="w-full sm:w-auto py-2 px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 shadow-sm transition order-1 sm:order-2 active:scale-[0.99]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Refletir sobre isso no Diário</span>
          </button>
        </div>
      )}
    </div>
  );
};
