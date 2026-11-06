/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { JournalEntry, JournalTag } from '../../types';
import { useData } from '../../contexts/DataContext';
import { X, Check, Trash2, Calendar, Clock, Tag } from 'lucide-react';

interface JournalEditorModalProps {
  initialData?: JournalEntry | null;
  defaultTag?: JournalTag;
  defaultTitle?: string;
  defaultContent?: string;
  onClose: () => void;
}

export const JOURNAL_TAG_LABELS: { tag: JournalTag; label: string; color: string }[] = [
  { tag: 'livre', label: 'Escrita livre', color: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300' },
  { tag: 'reflexao', label: 'Reflexão da Meditação', color: 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' },
  { tag: 'reuniao', label: 'Reunião de Apoio', color: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300' },
  { tag: 'gratidao', label: 'Gratidão', color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' },
  { tag: 'vitoria', label: 'Vitória Pessoal', color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' },
  { tag: 'dificuldade', label: 'Momento Difícil', color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300' },
];

export const JournalEditorModal: React.FC<JournalEditorModalProps> = ({ 
  initialData, 
  defaultTag, 
  defaultTitle, 
  defaultContent, 
  onClose 
}) => {
  const { saveJournalEntry, deleteJournalEntry } = useData();

  const [title, setTitle] = useState(initialData?.title ?? defaultTitle ?? '');
  const [content, setContent] = useState(initialData?.content ?? defaultContent ?? '');
  const [tag, setTag] = useState<JournalTag>(
    (initialData?.tag as JournalTag) ?? defaultTag ?? 'livre'
  );
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialData?.time || new Date().toTimeString().slice(0, 5));

  const handleSave = () => {
    if (!content.trim() && !title.trim()) return;

    saveJournalEntry(
      {
        date,
        time,
        title: title.trim() || undefined,
        content: content.trim(),
        tag,
      },
      initialData?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[90vh] overflow-y-auto flex flex-col transition-colors animate-slideUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-stone-500 dark:text-stone-400 text-xs">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-0 p-0 text-xs text-stone-700 dark:text-stone-300 focus:ring-0 cursor-pointer"
              />
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-transparent border-0 p-0 text-xs text-stone-700 dark:text-stone-300 focus:ring-0 cursor-pointer"
              />
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          {/* Tag Selector */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-stone-500 dark:text-stone-400 mb-2 font-medium">
              <Tag className="w-3.5 h-3.5" />
              <span>Tipo de escrita:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {JOURNAL_TAG_LABELS.map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => setTag(item.tag)}
                  className={`py-1 px-2.5 rounded-xl text-xs font-medium border transition ${
                    tag === item.tag
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="Título ou tema (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-serif text-lg font-medium text-stone-900 dark:text-stone-100 placeholder-stone-400 bg-transparent border-0 border-b border-stone-100 dark:border-stone-800 pb-2 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
          />

          <textarea
            placeholder="Escreva livremente o que estiver em seu coração e pensamentos..."
            rows={9}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full flex-1 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          {initialData ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Excluir esta entrada do diário?')) {
                  deleteJournalEntry(initialData.id);
                  onClose();
                }
              }}
              className="p-2.5 text-stone-400 hover:text-rose-600 rounded-xl transition"
              title="Excluir"
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
              disabled={!content.trim() && !title.trim()}
              onClick={handleSave}
              className="py-2.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm flex items-center space-x-2 shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              <span>Salvar no Diário</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
