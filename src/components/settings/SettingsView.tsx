/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
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
  LogOut,
  Database,
  RefreshCw,
  KeyRound,
  ExternalLink,
  Mail,
  AlertCircle
} from 'lucide-react';
import { ActiveModules } from '../../types';
import { ENABLE_SUPABASE } from '../../services/supabase';

export const SettingsView: React.FC = () => {
  const { 
    user, 
    preferences, 
    updatePreferences, 
    setPin, 
    hasPin, 
    logout,
    loadDemoData,
    isSupabaseReady,
    signInWithSupabase,
    signUpWithSupabase,
    signInWithMagicLink
  } = useAuth();

  const { syncWithCloud, isSyncing } = useData();

  const [pinInput, setPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  // Supabase Auth modal
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'magic'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [showSetupInstructions, setShowSetupInstructions] = useState(false);

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

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const res = await signInWithSupabase(emailInput, passwordInput);
        if (res.error) throw new Error(res.error);
        setShowSupabaseModal(false);
      } else if (authMode === 'signup') {
        const res = await signUpWithSupabase(emailInput, passwordInput, nameInput);
        if (res.error) throw new Error(res.error);
        setAuthSuccess('Conta criada com sucesso! Verifique seu e-mail para confirmação se necessário.');
        setTimeout(() => setShowSupabaseModal(false), 2000);
      } else {
        const res = await signInWithMagicLink(emailInput);
        if (res.error) throw new Error(res.error);
        setAuthSuccess('Link de acesso mágico enviado para seu e-mail!');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro durante autenticação.');
    } finally {
      setAuthLoading(false);
    }
  };

  const isCloudUser = isSupabaseReady && user && user.id !== 'local-guest';

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

      {/* Local-First & Supabase Tag Status Card */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h3 className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100">
              Armazenamento & Banco de Dados
            </h3>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
              ENABLE_SUPABASE && isCloudUser
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : ENABLE_SUPABASE && isSupabaseReady
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {ENABLE_SUPABASE ? 'SUPABASE: ATIVADO (TRUE)' : 'LOCAL-FIRST ATIVO (PADRÃO)'}
          </span>
        </div>

        {/* Local-First Description */}
        {!ENABLE_SUPABASE ? (
          <div className="space-y-3">
            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 text-xs text-stone-600 dark:text-stone-300 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-stone-800 dark:text-stone-100 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>100% dos dados residem neste aparelho</span>
              </p>
              <p>
                O aplicativo está operando com autonomia e privacidade absolutas no dispositivo. Não há envio de registros para nenhum banco de dados em nuvem.
              </p>
            </div>

            <div className="pt-1 flex items-center justify-between text-xs text-stone-500">
              <span>Tag de ativação:</span>
              <code className="text-[11px] font-mono bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-700 dark:text-stone-300">
                VITE_ENABLE_SUPABASE="false"
              </code>
            </div>

            <button
              type="button"
              onClick={() => setShowSetupInstructions(!showSetupInstructions)}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-medium hover:underline flex items-center space-x-1"
            >
              <span>{showSetupInstructions ? 'Ocultar instruções de nuvem' : 'Como ativar o Supabase se eu quiser no futuro?'}</span>
            </button>

            {showSetupInstructions && (
              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 text-xs text-stone-600 dark:text-stone-300 space-y-2 leading-relaxed">
                <p className="font-semibold text-stone-800 dark:text-stone-100">
                  Para ativar a sincronização em nuvem:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px]">
                  <li>Execute o script <code>supabase/schema.sql</code> no seu projeto Supabase.</li>
                  <li>Altere no seu arquivo <code>.env</code> ou variáveis do servidor:
                    <pre className="mt-1 p-2 bg-stone-900 text-stone-100 rounded-lg overflow-x-auto text-[10px]">
                      VITE_ENABLE_SUPABASE="true"&#10;VITE_SUPABASE_URL="https://seu-projeto.supabase.co"&#10;VITE_SUPABASE_ANON_KEY="sua-chave-anon"
                    </pre>
                  </li>
                  <li>Ao alterar para <code>"true"</code>, o app ativa o botão de sincronização em nuvem sem quebrar o código.</li>
                </ol>
              </div>
            )}
          </div>
        ) : isCloudUser ? (
          <div className="space-y-3">
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Tag <code>VITE_ENABLE_SUPABASE="true"</code> ativa. Seus dados estão sincronizando com o Supabase.
            </p>
            <div className="flex items-center space-x-3 pt-1">
              <button
                type="button"
                onClick={() => syncWithCloud()}
                disabled={isSyncing}
                className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium flex items-center space-x-2 shadow-xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Tag <code>VITE_ENABLE_SUPABASE="true"</code> ativa. Conecte sua conta para iniciar o salvamento em nuvem.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowSupabaseModal(true);
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium flex items-center space-x-2 shadow-xs transition"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Conectar Conta Supabase</span>
            </button>
          </div>
        )}
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

      {/* Supabase Auth Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 animate-slideUp">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                {authMode === 'login' ? 'Entrar com Supabase' : authMode === 'signup' ? 'Criar Conta Supabase' : 'Link Mágico'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSupabaseModal(false)}
                className="text-xs text-stone-400 hover:text-stone-600"
              >
                Fechar
              </button>
            </div>

            {/* Mode switch */}
            <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl text-xs">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(null); }}
                className={`flex-1 py-1.5 rounded-xl font-medium transition ${authMode === 'login' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                className={`flex-1 py-1.5 rounded-xl font-medium transition ${authMode === 'signup' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'}`}
              >
                Cadastrar
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('magic'); setAuthError(null); }}
                className={`flex-1 py-1.5 rounded-xl font-medium transition ${authMode === 'magic' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'}`}
              >
                Sem Senha
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-start space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-start space-x-1.5">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === 'signup' && (
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Como quer ser chamado(a)?</label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-stone-500 block mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100"
                />
              </div>

              {authMode !== 'magic' && (
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Senha</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition shadow-sm disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {authLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {authMode === 'login' ? 'Entrar' : authMode === 'signup' ? 'Criar Conta' : 'Enviar Link Mágico'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
