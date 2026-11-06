/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { storageService } from '../../services/storage';
import { 
  User, 
  ShieldCheck, 
  Lock, 
  Download, 
  Trash2, 
  Sparkles, 
  Clock, 
  Bell, 
  Check, 
  Info,
  LogOut
} from 'lucide-react';
import { ActiveModules } from '../../types';

export const SettingsView: React.FC = () => {
  const { 
    user, 
    preferences, 
    updatePreferences, 
    setPin, 
    hasPin, 
    logout,
    loadDemoData 
  } = useAuth();

  const [pinInput, setPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  const [name, setName] = useState(user?.displayName || '');
  const [timezone, setTimezone] = useState(preferences.timezone);

  const toggleModule = (key: keyof ActiveModules) => {
    updatePreferences({
      activeModules: {
        ...preferences.activeModules,
        [key]: !preferences.activeModules[key],
      },
    });
  };

  const handleSavePin = () => {
    if (pinInput.length === 4) {
      setPin(pinInput);
      setPinSuccess(true);
      setTimeout(() => {
        setPinSuccess(false);
        setShowPinSetup(false);
        setPinInput('');
      }, 1200);
    }
  };

  const handleRemovePin = () => {
    if (window.confirm('Remover o bloqueio por PIN?')) {
      setPin(null);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = storageService.exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `espaco_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csvStr = storageService.exportCheckInsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `espaco_checkins_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWipeAll = () => {
    if (
      window.confirm(
        'ATENÇÃO: Deseja apagar todos os dados registrados neste dispositivo? Esta ação não pode ser desfeita.'
      )
    ) {
      storageService.wipeAllData();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Profile Card */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-lg">
            {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'E'}
          </div>
          <div>
            <h2 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
              {user?.displayName || 'Modo Anônimo Local'}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {user?.email || 'Armazenamento estritamente local'}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-500">Fuso horário: {preferences.timezone}</span>
          <button
            type="button"
            onClick={logout}
            className="text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center space-x-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair / Trocar</span>
          </button>
        </div>
      </div>

      {/* Active Modules Toggle */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100">
            Módulos Ativos
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Oculte partes do aplicativo que não fizerem sentido no seu momento.
          </p>
        </div>

        <div className="space-y-2.5">
          {[
            { key: 'mood', label: 'Humor & Emoções' },
            { key: 'sleep', label: 'Sono & Repouso' },
            { key: 'behaviors', label: 'Impulsos & Comportamentos' },
            { key: 'journal', label: 'Diário Pessoal' },
            { key: 'recovery', label: 'Jornada de Recuperação' },
          ].map((item) => {
            const k = item.key as keyof ActiveModules;
            const isChecked = preferences.activeModules[k];
            return (
              <div
                key={item.key}
                onClick={() => toggleModule(k)}
                className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800 cursor-pointer transition hover:bg-stone-100"
              >
                <span className="text-xs font-medium text-stone-800 dark:text-stone-200">
                  {item.label}
                </span>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                    isChecked
                      ? 'bg-emerald-600 text-white'
                      : 'border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy & PIN Lock */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h3 className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100">
            Bloqueio & Privacidade
          </h3>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800">
          <div>
            <p className="text-xs font-medium text-stone-800 dark:text-stone-200">
              PIN de 4 dígitos
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {hasPin ? 'Bloqueio ativado' : 'Sem bloqueio ativo'}
            </p>
          </div>

          {hasPin ? (
            <button
              type="button"
              onClick={handleRemovePin}
              className="py-1.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              Remover PIN
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowPinSetup(true)}
              className="py-1.5 px-3 rounded-xl bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800"
            >
              Criar PIN
            </button>
          )}
        </div>

        {showPinSetup && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
            <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
              Digite o novo PIN numérico de 4 dígitos:
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="w-24 p-2 text-center tracking-widest text-lg font-mono rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-stone-900"
              />
              <button
                type="button"
                onClick={handleSavePin}
                disabled={pinInput.length !== 4}
                className="py-2 px-4 rounded-xl bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium"
              >
                {pinSuccess ? 'Salvo!' : 'Salvar PIN'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPinSetup(false);
                  setPinInput('');
                }}
                className="py-2 px-3 text-stone-500 text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications - Off by default */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-stone-400" />
          <h3 className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100">
            Lembretes Voluntários
          </h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Por princípio de não-pressão, lembretes permanecem desativados até que você decida ativá-los.
        </p>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800">
          <span className="text-xs font-medium text-stone-800 dark:text-stone-200">
            Lembrete diário suave
          </span>
          <button
            type="button"
            onClick={() => updatePreferences({ notificationsEnabled: !preferences.notificationsEnabled })}
            className={`py-1 px-3 rounded-xl text-xs font-medium transition ${
              preferences.notificationsEnabled
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
            }`}
          >
            {preferences.notificationsEnabled ? 'Ativado' : 'Desativado'}
          </button>
        </div>
      </div>

      {/* Data Export & Backup */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h3 className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100">
            Exportar & Preservar Dados
          </h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Seus dados pertencem a você. Exporte um arquivo completo a qualquer momento.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex-1 py-2.5 px-4 rounded-2xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center justify-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Tudo (JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 py-2.5 px-4 rounded-2xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center justify-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Check-ins (CSV)</span>
          </button>
        </div>

        {/* Demo data filler */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-400">Quer testar com dados de exemplo?</span>
          <button
            type="button"
            onClick={loadDemoData}
            className="py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium flex items-center space-x-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Carregar Exemplo</span>
          </button>
        </div>
      </div>

      {/* Manifesto: O que o Espaço não faz */}
      <div className="bg-stone-100 dark:bg-stone-800/40 p-5 rounded-3xl border border-stone-200/60 dark:border-stone-800 space-y-2 text-xs text-stone-600 dark:text-stone-400">
        <div className="flex items-center space-x-2 text-stone-800 dark:text-stone-200 font-medium">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Compromissos Éticos do Espaço</span>
        </div>
        <ul className="space-y-1 list-disc list-inside text-[11px] leading-relaxed">
          <li>Não geramos diagnósticos médicos ou psiquiátricos.</li>
          <li>Não há streaks, perda de medalhas ou mensagens punitivas.</li>
          <li>Em caso de recaída ou recomeço, seu tempo anterior é sempre respeitado e mantido no histórico.</li>
          <li>Não comercializamos, vendemos nem rastreamos seus registros.</li>
        </ul>
      </div>

      {/* Wipe data */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={handleWipeAll}
          className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center justify-center space-x-1 mx-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Apagar todos os dados deste dispositivo</span>
        </button>
      </div>
    </div>
  );
};
