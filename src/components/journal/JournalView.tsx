/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { JournalEntry, JournalTag } from '../../types';
import { JournalEditorModal, JOURNAL_TAG_LABELS } from './JournalEditorModal';
import { Plus, Search, BookOpen, Calendar, Clock, Lock, Tag } from 'lucide-react';

interface JournalViewProps {
  incomingReflection?: {
    tag: JournalTag;
    title: string;
    content: string;
  } | null;
  onClearIncomingReflection?: () => void;
}

export const JournalView: React.FC<JournalViewProps> = ({ 
  incomingReflection, 
  onClearIncomingReflection 
}) => {
  const { journalEntries } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('todos');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // If redirected from NA meditation reflection button
  useEffect(() => {
    if (incomingReflection) {
      setIsCreatingNew(true);
    }
  }, [incomingReflection]);

  const filteredEntries = journalEntries.filter(e => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (e.title && e.title.toLowerCase().includes(term)) ||
      e.content.toLowerCase().includes(term) ||
      e.date.includes(term);

    const matchesTag = 
      selectedTagFilter === 'todos' || 
      e.tag === selectedTagFilter || 
      (!e.tag && selectedTagFilter === 'livre');

    return matchesSearch && matchesTag;
  });

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

  const getTagBadge = (tag?: string) => {
    const meta = JOURNAL_TAG_LABELS.find(t => t.tag === tag);
    if (!meta) return null;
    return (
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
        {meta.label}
      </span>
    );
  };

  return (
    <div className="space-y-5 pb-20 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-primary-soft/70 dark:bg-primary-soft/30 p-5 rounded-3xl border border-primary/25 dark:border-primary/25 flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-primary dark:text-primary">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Diário Pessoal & Privado
            </span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
            Um único lugar para reflexões de meditação, reuniões, gratidão ou desabafos livres. Tudo protegido no seu dispositivo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreatingNew(true)}
          className="py-2 px-3.5 rounded-2xl bg-primary hover:bg-primary-hover dark:bg-primary text-on-primary font-medium text-xs flex items-center space-x-1.5 shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Escrever</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-ink-subtle absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Buscar nas anotações..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-line bg-raised text-sm text-ink placeholder-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary transition"
        />
      </div>

      {/* Tag filters */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedTagFilter('todos')}
          className={`py-1.5 px-3 rounded-xl text-xs font-medium whitespace-nowrap transition ${
            selectedTagFilter === 'todos'
              ? 'bg-ink text-surface'
              : 'bg-sunken text-ink-muted hover:bg-sunken-strong'
          }`}
        >
          Todos ({journalEntries.length})
        </button>
        {JOURNAL_TAG_LABELS.map(t => {
          const count = journalEntries.filter(e => e.tag === t.tag || (!e.tag && t.tag === 'livre')).length;
          if (count === 0 && selectedTagFilter !== t.tag) return null;
          return (
            <button
              key={t.tag}
              type="button"
              onClick={() => setSelectedTagFilter(t.tag)}
              className={`py-1.5 px-3 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedTagFilter === t.tag
                  ? 'bg-primary text-on-primary dark:bg-primary'
                  : 'bg-sunken text-ink-muted hover:bg-sunken-strong'
              }`}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Entry List */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-16 px-4 bg-raised rounded-3xl border border-line space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sunken text-ink-subtle flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-ink">
            {searchTerm || selectedTagFilter !== 'todos' ? 'Nenhuma anotação nesta categoria' : 'Nenhuma entrada ainda'}
          </h3>
          <p className="text-xs text-ink-muted max-w-xs mx-auto">
            {searchTerm || selectedTagFilter !== 'todos'
              ? 'Tente selecionar outro filtro ou limpar a pesquisa.'
              : 'Seu diário é um refúgio acolhedor. Toque no botão "Escrever" quando sentir vontade.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => setEditingEntry(entry)}
              className="p-5 rounded-3xl bg-raised border border-line hover:border-primary/25 dark:hover:border-primary/25 shadow-xs hover:shadow-sm transition cursor-pointer space-y-2.5 group"
            >
              <div className="flex items-center justify-between text-xs text-ink-subtle">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-1.5 font-medium text-ink-muted">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(entry.date)}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{entry.time}</span>
                  </span>
                </div>
                {getTagBadge(entry.tag || 'livre')}
              </div>

              {entry.title && (
                <h3 className="text-base font-serif font-medium text-ink group-hover:text-primary dark:group-hover:text-primary transition">
                  {entry.title}
                </h3>
              )}

              <p className="text-xs md:text-sm text-ink-muted line-clamp-3 leading-relaxed">
                {entry.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {(isCreatingNew || editingEntry) && (
        <JournalEditorModal
          initialData={editingEntry}
          defaultTag={incomingReflection?.tag}
          defaultTitle={incomingReflection?.title}
          defaultContent={incomingReflection?.content}
          onClose={() => {
            setIsCreatingNew(false);
            setEditingEntry(null);
            if (onClearIncomingReflection) {
              onClearIncomingReflection();
            }
          }}
        />
      )}
    </div>
  );
};
