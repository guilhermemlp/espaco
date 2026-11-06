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
    const todayStr = initialData?.date || new Date().toISOString().split('T')[0];
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[90vh] overflow-y-auto flex flex-col transition-colors animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                Impulso & Comportamento
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Observando a vontade sem julgamento
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Category selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Qual impulso você está observando?
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="text-xs text-emerald-700 dark:text-emerald-400 font-medium hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Nova categoria</span>
              </button>
            </div>

            {isCreatingCategory && (
              <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Nome do impulso (ex: Roer unhas, Café...)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 py-1.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="py-1.5 px-3 rounded-xl bg-emerald-700 text-white text-xs font-medium"
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
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 1: Urge Intensity (0 - 10) */}
          <div className="space-y-3 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                1. Intensidade do Impulso (Vontade)
              </label>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {intensity} / 10
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-rose-600 dark:accent-rose-500 h-2 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>0 (Quase nula)</span>
              <span>5 (Moderada)</span>
              <span>10 (Muito intensa)</span>
            </div>
          </div>

          {/* Step 2: Behavior Occurrence */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
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
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Perceived Control */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
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
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Optional context & consequence */}
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Gatilho ou Contexto (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Fim de tarde estressante, conversa difícil..."
                value={triggers}
                onChange={(e) => setTriggers(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                O que você fez ou sentiu depois? (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Saí para caminhar, conversei com alguém..."
                value={consequences}
                onChange={(e) => setConsequences(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          {initialData ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Excluir este registro?')) {
                  deleteBehaviorEntry(initialData.id);
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
              onClick={handleSave}
              className="py-2.5 px-6 rounded-2xl bg-rose-700 hover:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-medium text-sm flex items-center space-x-2 shadow-sm transition"
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
