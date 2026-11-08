/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BehaviorEntry, 
  BehaviorOccurrence, 
  PerceivedControl 
} from '../../types';
import { useData } from '../../contexts/DataContext';
import { todayLocalDate } from '../../utils/date';
import { X, Flame, Check, Plus, Trash2 } from 'lucide-react';

interface BehaviorEntryModalProps {
  initialData?: BehaviorEntry | null;
  onClose: () => void;
}

export const BehaviorEntryModal: React.FC<BehaviorEntryModalProps> = ({ initialData, onClose }) => {
  const { categories, addCategory, saveBehaviorEntry, deleteBehaviorEntry } = useData();

  const [categoryId, setCategoryId] = useState<string>(
    initialData?.categoryId || categories[0]?.id || ''
  );
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [intensity, setIntensity] = useState<number>(initialData?.urgeIntensity ?? 5);
  const [occurrence, setOccurrence] = useState<BehaviorOccurrence>(
    initialData?.behaviorOccurrence || 'nao_ocorreu'
  );
  const [control, setControl] = useState<PerceivedControl>(
    initialData?.perceivedControl || 'controle'
  );
  const [triggers, setTriggers] = useState<string>(initialData?.triggers || '');
  const [consequences, setConsequences] = useState<string>(initialData?.consequences || '');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      addCategory(newCatName.trim());
      setNewCatName('');
      setIsCreatingCategory(false);
    }
  };

  const handleSave = () => {
    const todayStr = initialData?.date || todayLocalDate();
    const timeStr = initialData?.time || new Date().toTimeString().slice(0, 5);

    saveBehaviorEntry(
      {
        categoryId,
        date: todayStr,
        time: timeStr,
        urgeIntensity: intensity,
        behaviorOccurrence: occurrence,
        perceivedControl: control,
        triggers: triggers.trim() || undefined,
        consequences: consequences.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      initialData?.id
    );

    onClose();
  };

  const occurrenceOptions: { value: BehaviorOccurrence; label: string; desc: string }[] = [
    { value: 'nao_ocorreu', label: 'Não ocorreu', desc: 'Ficou apenas na vontade/pensamento' },
    { value: 'uma_vez', label: 'Ocorreu uma vez', desc: 'Aconteceu em um momento isolado' },
    { value: 'repetidamente', label: 'Ocorreu repetidamente', desc: 'Repetiu-se mais de uma vez' },
    { value: 'prefiro_nao_informar', label: 'Prefiro não informar', desc: 'Sem pressão para detalhar' },
  ];

  const controlOptions: { value: PerceivedControl; label: string; desc: string }[] = [
    { value: 'controle', label: 'Tive controle', desc: 'Consegui gerenciar a resposta' },
    { value: 'alguma_dificuldade', label: 'Alguma dificuldade', desc: 'Exigiu esforço considerável' },
    { value: 'perda_controle', label: 'Perda de controle', desc: 'Senti que escapou do controle' },
    { value: 'nao_sei_avaliar', label: 'Não sei avaliar', desc: 'Difícil definir no momento' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-scrim backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-raised rounded-t-3xl sm:rounded-3xl shadow-2xl border border-line max-h-[90vh] overflow-y-auto flex flex-col transition-colors animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-raised/95 dark:bg-raised/95 backdrop-blur-md px-6 py-4 border-b border-line flex items-center justify-between z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-danger-soft dark:bg-danger-soft/60 text-danger dark:text-danger">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-medium text-ink">
                Impulso & Comportamento
              </h2>
              <p className="text-xs text-ink-muted">
                Observando a vontade sem julgamento
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
          {/* Category selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Qual impulso você está observando?
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="text-xs text-primary dark:text-primary font-medium hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Nova categoria</span>
              </button>
            </div>

            {isCreatingCategory && (
              <div className="p-3 bg-sunken rounded-2xl flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Nome do impulso (ex: Roer unhas, Café...)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 py-1.5 px-3 rounded-xl border border-line-strong bg-raised text-xs text-ink"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="py-1.5 px-3 rounded-xl bg-primary text-on-primary text-xs font-medium"
                >
                  Salvar
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`py-2 px-3.5 rounded-xl text-xs font-medium border transition ${
                    categoryId === cat.id
                      ? 'bg-danger-soft dark:bg-danger-soft/40 border-danger text-danger dark:text-danger ring-2 ring-danger/20'
                      : 'border-line text-ink-muted hover:bg-sunken'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 1: Urge Intensity (0 - 10) */}
          <div className="space-y-3 p-4 rounded-2xl bg-sunken border border-line">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                1. Intensidade do Impulso (Vontade)
              </label>
              <span className="text-sm font-bold text-danger dark:text-danger">
                {intensity} / 10
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-danger dark:accent-danger h-2 bg-sunken-strong rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-ink-subtle">
              <span>0 (Quase nula)</span>
              <span>5 (Moderada)</span>
              <span>10 (Muito intensa)</span>
            </div>
          </div>

          {/* Step 2: Behavior Occurrence */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              2. O comportamento ocorreu?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {occurrenceOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setOccurrence(opt.value)}
                  className={`p-3 rounded-2xl border text-left transition ${
                    occurrence === opt.value
                      ? 'bg-danger-soft dark:bg-danger-soft/40 border-danger text-danger dark:text-danger ring-2 ring-danger/20'
                      : 'border-line text-ink-muted hover:bg-sunken'
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] text-ink-subtle mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Perceived Control */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              3. Controle percebido
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {controlOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setControl(opt.value)}
                  className={`p-3 rounded-2xl border text-left transition ${
                    control === opt.value
                      ? 'bg-accent-soft dark:bg-accent-soft/40 border-accent text-accent dark:text-accent ring-2 ring-accent/20'
                      : 'border-line text-ink-muted hover:bg-sunken'
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] text-ink-subtle mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Optional context & consequence */}
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Gatilho ou Contexto (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Fim de tarde estressante, conversa difícil..."
                value={triggers}
                onChange={(e) => setTriggers(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-line bg-sunken text-xs text-ink placeholder-ink-subtle focus:outline-none focus:ring-2 focus:ring-danger"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                O que você fez ou sentiu depois? (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Saí para caminhar, conversei com alguém..."
                value={consequences}
                onChange={(e) => setConsequences(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-line bg-sunken text-xs text-ink placeholder-ink-subtle focus:outline-none focus:ring-2 focus:ring-danger"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-sunken dark:bg-raised border-t border-line flex items-center justify-between">
          {initialData ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Excluir este registro?')) {
                  deleteBehaviorEntry(initialData.id);
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
              onClick={handleSave}
              className="py-2.5 px-6 rounded-2xl bg-danger hover:bg-danger-hover dark:bg-danger dark:hover:bg-danger-hover text-on-primary font-medium text-sm flex items-center space-x-2 shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Registro</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
