/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Check,
  Clock,
  Cloud,
  Database,
  Download,
  Info,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { storageService } from '../../services/storage';
import { todayLocalDate } from '../../utils/date';
import { ActiveModules } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    user,
    preferences,
    updatePreferences,
    setPin,
    hasPin,
    logout,
    loadDemoData,
  } = useAuth();

  const {
    isCloud,
    isSyncing,
    syncError,
    lastSyncedAt,
    syncWithCloud,
    pushLocalSnapshotToCloud,
    wipeCloudData,
  } = useData();

  const [pinInput, setPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `espaco_backup_${todayLocalDate()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csvStr = storageService.exportCheckInsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `espaco_checkins_${todayLocalDate()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!window.confirm('Importar este backup substituirá os dados atuais deste espaço. Continuar?')) {
      return;
    }

    setDataError(null);
    setDataMessage(null);
    setIsWorking(true);

    try {
      if (user?.id) storageService.setActiveUser(user.id);
      const text = await file.text();
      storageService.importAllDataJSON(text);

      if (isCloud) {
        const pushed = await pushLocalSnapshotToCloud();
        if (!pushed) {
          setDataMessage(
            'Backup importado. Alguns registros serão reenviados automaticamente na próxima sincronização.',
          );
        }
      }

      window.location.reload();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Não foi possível importar o backup.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleImportLegacy = async () => {
    if (!user?.id) return;
    if (!window.confirm('Importar os dados antigos deste dispositivo para a sua conta?')) return;

    setDataError(null);
    setDataMessage(null);
    setIsWorking(true);

    try {
      storageService.setActiveUser(user.id);
      const imported = storageService.importLegacyData();
      if (!imported) {
        setDataError('Não encontramos dados antigos para importar.');
        return;
      }

      if (isCloud) {
        const pushed = await pushLocalSnapshotToCloud();
        if (!pushed) {
          setDataMessage(
            'Dados antigos importados. Alguns registros serão reenviados na próxima sincronização.',
          );
        }
      }

      window.location.reload();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Falha ao importar os dados antigos.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleDemoData = async () => {
    if (!window.confirm('Carregar dados de exemplo? Os dados atuais deste espaço serão substituídos.')) {
      return;
    }
    await loadDemoData();
  };

  const handleWipeAll = async () => {
    const scope = isCloud ? 'na nuvem e neste dispositivo' : 'neste dispositivo';
    if (
      !window.confirm(
        `ATENÇÃO: apagar todos os seus dados ${scope}? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    setDataError(null);
    setDataMessage(null);
    setIsWorking(true);

    try {
      if (isCloud) {
        const deleted = await wipeCloudData();
        if (!deleted) {
          setDataError('Não foi possível apagar os dados da nuvem. Tente novamente.');
          return;
        }
      }

      if (user?.id) storageService.setActiveUser(user.id);
      storageService.wipeActiveUserData();
      window.location.reload();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Falha ao apagar os dados.');
    } finally {
      setIsWorking(false);
    }
  };

  const lastSyncedLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const hasLegacyData = storageService.hasLegacyData();

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Conta */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-lg">
            {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'E'}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100 truncate">
              {user?.displayName || 'Meu espaço'}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
              {isCloud ? user?.email || 'Conta na nuvem' : 'Modo local (sem conta)'}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-500">Fuso horário: {preferences.timezone}</span>
          {isCloud ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair da conta</span>
            </button>
          ) : (
            <span className="text-[11px] text-stone-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Dados só neste aparelho</span>
            </span>
          )}
        </div>
      </div>

      {/* Armazenamento e sincronização */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h3 className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100">
              Armazenamento & Sincronização
            </h3>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
              isCloud
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
            }`}
          >
            {isCloud ? 'NUVEM ATIVA' : 'MODO LOCAL'}
          </span>
        </div>

        {isCloud ? (
          <div className="space-y-3">
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Seus registros são salvos na sua conta, com acesso protegido por usuário. O
              dispositivo mantém um cache para uso rápido e offline.
            </p>

            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/60 dark:border-stone-800 flex items-center justify-between text-xs">
              <span className="flex items-center space-x-2 text-stone-600 dark:text-stone-300">
                <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {isSyncing
                    ? 'Sincronizando agora...'
                    : syncError
                      ? 'Sincronização pendente'
                      : 'Tudo sincronizado'}
                </span>
              </span>
              <span className="text-[11px] text-stone-400 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{lastSyncedLabel || 'aguardando'}</span>
              </span>
            </div>

            {syncError && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{syncError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => void syncWithCloud()}
              disabled={isSyncing}
              className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-medium flex items-center space-x-2 shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/60 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-stone-800 dark:text-stone-100 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>100% dos dados residem neste aparelho</span>
              </p>
              <p>
                O Supabase está desativado neste ambiente. Tudo fica apenas neste dispositivo, sem
                envio de registros para a nuvem.
              </p>
            </div>

            <p className="text-[11px] text-stone-400 leading-relaxed">
              Para ativar contas e sincronização, configure{' '}
              <code className="font-mono">VITE_SUPABASE_URL</code> e{' '}
              <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> e mantenha{' '}
              <code className="font-mono">VITE_ENABLE_SUPABASE</code> diferente de{' '}
              <code className="font-mono">"false"</code>.
            </p>
          </div>
        )}
      </div>

      {/* Módulos ativos */}
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
            const key = item.key as keyof ActiveModules;
            const isChecked = preferences.activeModules[key];
            return (
              <div
                key={item.key}
                onClick={() => toggleModule(key)}
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

      {/* Bloqueio & privacidade */}
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
              {hasPin ? 'Bloqueio ativado' : 'Sem bloqueio ativo'} · fica apenas neste dispositivo
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
                onChange={(event) => setPinInput(event.target.value.replace(/\D/g, ''))}
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

      {/* Lembretes */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-stone-400" />
          <h3 className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100">
            Lembretes Voluntários
          </h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Por princípio de não-pressão, lembretes permanecem desativados até que você decida
          ativá-los.
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

      {/* Exportar, importar e preservar */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h3 className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100">
            Exportar & Preservar Dados
          </h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Seus dados pertencem a você. Exporte ou restaure um arquivo completo a qualquer momento.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex-1 py-2.5 px-4 rounded-2xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center justify-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Exportar tudo (JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 py-2.5 px-4 rounded-2xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center justify-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Exportar check-ins (CSV)</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isWorking}
            className="flex-1 py-2.5 px-4 rounded-2xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-60 text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center justify-center space-x-2 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Importar backup (JSON)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportBackup}
            className="hidden"
          />
        </div>

        {hasLegacyData && (
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Encontramos dados da versão anterior deste aplicativo neste dispositivo.
            </p>
            <button
              type="button"
              onClick={() => void handleImportLegacy()}
              disabled={isWorking}
              className="py-2 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 disabled:opacity-60 text-stone-700 dark:text-stone-300 text-xs font-medium"
            >
              Importar dados antigos
            </button>
          </div>
        )}

        {dataError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{dataError}</span>
          </div>
        )}

        {dataMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-start space-x-2">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{dataMessage}</span>
          </div>
        )}

        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-400">Quer testar com dados de exemplo?</span>
          <button
            type="button"
            onClick={() => void handleDemoData()}
            disabled={isWorking}
            className="py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 disabled:opacity-60 text-stone-700 dark:text-stone-300 text-xs font-medium flex items-center space-x-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Carregar exemplo</span>
          </button>
        </div>
      </div>

      {/* Manifesto */}
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

      {/* Apagar dados */}
      <div className="pt-2 text-center space-y-1">
        <button
          type="button"
          onClick={() => void handleWipeAll()}
          disabled={isWorking}
          className="text-xs text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-60 flex items-center justify-center space-x-1 mx-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>
            {isCloud ? 'Apagar todos os dados (nuvem e dispositivo)' : 'Apagar todos os dados deste dispositivo'}
          </span>
        </button>
        {isCloud && (
          <p className="text-[10px] text-stone-400">
            Sua conta de acesso é mantida; os registros são apagados.
          </p>
        )}
      </div>
    </div>
  );
};
