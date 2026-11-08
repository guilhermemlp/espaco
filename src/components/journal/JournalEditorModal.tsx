/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { JournalEntry, JournalTag } from '../../types';
import { useData } from '../../contexts/DataContext';
import { todayLocalDate } from '../../utils/date';
import { X, Check, Trash2, Calendar, Clock, Tag } from 'lucide-react';

interface JournalEditorModalProps {
  initialData?: JournalEntry | null;
  defaultTag?: JournalTag;
  defaultTitle?: string;
  defaultContent?: string;
  onClose: () => void;
}

export const JOURNAL_TAG_LABELS: { tag: JournalTag; label: string; color: string }[] = [
  { tag: 'livre', label: 'Escrita livre', color: 'bg-sunken text-ink-muted' },
  { tag: 'reflexao', label: 'Reflexão da Meditação', color: 'bg-accent-soft dark:bg-accent-soft/60 text-accent dark:text-accent' },
  { tag: 'reuniao', label: 'Reunião de Apoio', color: 'bg-info-soft dark:bg-info-soft/60 text-info dark:text-info' },
  { tag: 'gratidao', label: 'Gratidão', color: 'bg-warning-soft dark:bg-warning-soft/60 text-warning dark:text-warning' },
  { tag: 'vitoria', label: 'Vitória Pessoal', color: 'bg-primary-soft dark:bg-primary-soft/60 text-primary dark:text-primary' },
  { tag: 'dificuldade', label: 'Momento Difícil', color: 'bg-danger-soft dark:bg-danger-soft/60 text-danger dark:text-danger' },
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
  const [date, setDate] = useState(initialData?.date || todayLocalDate());
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-raised rounded-3xl shadow-2xl border border-line max-h-[90vh] overflow-y-auto flex flex-col transition-colors animate-slideUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center space-x-2 text-ink-muted text-xs">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-0 p-0 text-xs text-ink-muted focus:ring-0 cursor-pointer"
              />
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-transparent border-0 p-0 text-xs text-ink-muted focus:ring-0 cursor-pointer"
              />
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-subtle hover:text-ink hover:bg-sunken-strong transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          {/* Tag Selector */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-ink-muted mb-2 font-medium">
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
                      ? 'border-primary bg-primary-soft dark:bg-primary-soft/40 text-primary dark:text-primary ring-2 ring-primary/20'
                      : 'border-line text-ink-muted hover:bg-sunken'
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
            className="w-full font-serif text-lg font-medium text-ink placeholder-ink-subtle bg-transparent border-0 border-b border-line pb-2 focus:outline-none focus:border-primary dark:focus:border-primary"
          />

          <textarea
            placeholder="Escreva livremente o que estiver em seu coração e pensamentos..."
            rows={9}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full flex-1 p-3 rounded-2xl bg-sunken border border-line text-sm text-ink placeholder-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary resize-none leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-sunken dark:bg-raised border-t border-line flex items-center justify-between">
          {initialData ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Excluir esta entrada do diário?')) {
                  deleteJournalEntry(initialData.id);
                  onClose();
                }
              }}
              className="p-2.5 text-ink-subtle hover:text-danger rounded-xl transition"
              title="Excluir"
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
              disabled={!content.trim() && !title.trim()}
              onClick={handleSave}
              className="py-2.5 px-6 rounded-2xl bg-primary hover:bg-primary-hover dark:bg-primary disabled:opacity-50 text-on-primary font-medium text-sm flex items-center space-x-2 shadow-sm transition"
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
