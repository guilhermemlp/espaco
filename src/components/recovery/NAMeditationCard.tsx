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
    <div className="bg-raised rounded-3xl border border-line shadow-xs overflow-hidden transition-all">
      {/* Top Header */}
      <div className="px-5 md:px-6 pt-5 pb-3 border-b border-line flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-accent-soft dark:bg-accent-soft/70 text-accent dark:text-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-accent dark:text-accent">
                Meditação Diária
              </span>
              <span className="text-[10px] text-ink-subtle">• Narcóticos Anônimos</span>
            </div>
            <p className="text-xs text-ink-muted font-medium flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-ink-subtle" />
              <span>{meditation?.date || 'Hoje'}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchMeditation(true)}
          disabled={loading}
          className="p-2 rounded-xl text-ink-subtle hover:text-ink hover:bg-sunken-strong transition disabled:opacity-50"
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
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-ink-muted">
              Coletando a meditação do dia de na.org.br...
            </p>
          </div>
        ) : error && !meditation ? (
          <div className="py-6 text-center space-y-3">
            <AlertCircle className="w-6 h-6 text-warning mx-auto" />
            <p className="text-xs text-ink-muted max-w-xs mx-auto">
              Não foi possível sincronizar no momento. Você pode tentar novamente ou acessar diretamente o site.
            </p>
            <div className="flex items-center justify-center space-x-3 pt-1">
              <button
                type="button"
                onClick={() => fetchMeditation(true)}
                className="py-1.5 px-3 rounded-xl bg-sunken text-xs font-medium text-ink-muted"
              >
                Tentar novamente
              </button>
              <a
                href="https://www.na.org.br/meditacao/"
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-3 rounded-xl border border-line-strong text-xs font-medium text-accent dark:text-accent flex items-center space-x-1"
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
              <h3 className="text-lg md:text-xl font-serif font-medium text-ink leading-snug">
                {meditation.title}
              </h3>
            </div>

            {/* Opening Quote & Citation */}
            {meditation.quote && (
              <div className="p-4 rounded-2xl bg-accent-soft/60 dark:bg-accent-soft/30 border border-accent/25 dark:border-accent/25 relative">
                <Quote className="w-4 h-4 text-accent/60 dark:text-accent/60 mb-1" />
                <p className="text-xs md:text-sm font-medium italic text-ink leading-relaxed">
                  {meditation.quote}
                </p>
                {meditation.source && (
                  <p className="text-[11px] text-accent dark:text-accent font-semibold mt-2 text-right">
                    — {meditation.source}
                  </p>
                )}
              </div>
            )}

            {/* Meditation Body Text */}
            <div className="space-y-3 text-xs md:text-sm text-ink-muted leading-relaxed font-sans">
              {meditation.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* 'Só por hoje' Block */}
            {meditation.justForToday && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-primary to-accent dark:from-primary/40 dark:to-accent/40 border border-primary/25 dark:border-primary/25 space-y-1.5 shadow-2xs">
                <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:text-primary">
                  <Heart className="w-3.5 h-3.5 fill-primary dark:fill-primary text-primary dark:text-primary" />
                  <span>Só por hoje</span>
                </div>
                <p className="text-xs md:text-sm text-ink font-medium leading-relaxed">
                  {meditation.justForToday}
                </p>
              </div>
            )}

            {/* Attribution */}
            <p className="text-[10px] text-ink-subtle text-center pt-1">
              {meditation.copyright}
            </p>
          </div>
        ) : null}
      </div>

      {/* Card Actions */}
      {meditation && (
        <div className="px-5 md:px-6 py-3.5 bg-sunken dark:bg-raised border-t border-line flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <a
            href={meditation.sourceUrl || 'https://www.na.org.br/meditacao/'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ink-muted hover:text-ink flex items-center space-x-1 transition order-2 sm:order-1"
          >
            <span>Ver no site oficial da NA</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={handleReflectClick}
            className="w-full sm:w-auto py-2 px-4 rounded-2xl bg-accent hover:bg-accent-hover dark:bg-accent text-on-primary font-medium text-xs flex items-center justify-center space-x-1.5 shadow-sm transition order-1 sm:order-2 active:scale-[0.99]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Refletir sobre isso no Diário</span>
          </button>
        </div>
      )}
    </div>
  );
};
