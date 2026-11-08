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
  KeyRound,
  Loader2,
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
import { MIN_PASSWORD_LENGTH, validatePassword } from '../../utils/password';
import { ActiveModules } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    user,
    preferences,
    updatePreferences,
    setPin,
    hasPin,
    updatePassword,
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

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As duas senhas precisam ser iguais.');
      return;
    }

    setSavingPassword(true);
    try {
      const result = await updatePassword(newPassword);
      if (result.error) {
        setPasswordError(result.error);
        return;
      }

      setPasswordMessage(result.message || 'Senha atualizada com sucesso.');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : 'Não foi possível atualizar a senha.',
      );
    } finally {
      setSavingPassword(false);
    }
  };

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
      <div className="bg-raised p-6 rounded-3xl border border-line shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-soft dark:bg-primary-soft/70 text-primary dark:text-primary flex items-center justify-center font-bold text-lg">
            {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'E'}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-serif font-medium text-ink truncate">
              {user?.displayName || 'Meu espaço'}
            </h2>
            <p className="text-xs text-ink-muted truncate">
              {isCloud ? user?.email || 'Conta na nuvem' : 'Modo local (sem conta)'}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-line flex items-center justify-between">
          <span className="text-xs text-ink-muted">Fuso horário: {preferences.timezone}</span>
          {isCloud ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="text-xs font-medium text-ink-muted hover:text-ink flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair da conta</span>
            </button>
          ) : (
            <span className="text-[11px] text-ink-subtle flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Dados só neste aparelho</span>
            </span>
          )}
        </div>
      </div>

      {/* Segurança da conta */}
      {isCloud && (
        <div className="bg-raised p-6 rounded-3xl border border-line shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-primary dark:text-primary" />
            <h3 className="text-sm font-serif font-medium text-ink">
              Segurança da conta
            </h3>
          </div>

          <p className="text-xs text-ink-muted leading-relaxed">
            Você pode definir ou trocar a sua senha aqui. Se preferir, o acesso por link mágico
            continua funcionando sem senha.
          </p>

          {passwordMessage && (
            <div className="p-3 bg-primary-soft dark:bg-primary-soft/40 text-primary dark:text-primary rounded-xl text-xs flex items-start space-x-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{passwordMessage}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-danger-soft dark:bg-danger-soft/40 text-danger dark:text-danger rounded-xl text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          {showPasswordChange ? (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">
                  Nova senha
                </label>
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
                  aria-label="Nova senha"
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 rounded-xl border border-line-strong bg-raised text-sm placeholder-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">
                  Repita a nova senha
                </label>
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Digite novamente"
                  aria-label="Repita a nova senha"
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 rounded-xl border border-line-strong bg-raised text-sm placeholder-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="py-2 px-4 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-60 text-on-primary text-xs font-medium flex items-center space-x-2 transition"
                >
                  {savingPassword ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>{savingPassword ? 'Salvando...' : 'Salvar senha'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError(null);
                  }}
                  className="py-2 px-3 text-ink-muted text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowPasswordChange(true);
                setPasswordError(null);
                setPasswordMessage(null);
              }}
              className="py-2 px-4 rounded-xl border border-line-strong hover:bg-sunken text-xs font-medium text-ink transition"
            >
              Alterar senha
            </button>
          )}
        </div>
      )}

      {/* Armazenamento e sincronização */}
      <div className="bg-raised p-6 rounded-3xl border border-line shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-primary dark:text-primary" />
            <h3 className="text-sm font-serif font-medium text-ink">
              Armazenamento & Sincronização
            </h3>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
              isCloud
                ? 'bg-primary-soft text-primary dark:bg-primary-soft dark:text-primary'
                : 'bg-sunken text-ink-muted'
            }`}
          >
            {isCloud ? 'NUVEM ATIVA' : 'MODO LOCAL'}
          </span>
        </div>

        {isCloud ? (
          <div className="space-y-3">
            <p className="text-xs text-ink-muted leading-relaxed">
              Seus registros são salvos na sua conta, com acesso protegido por usuário. O
              dispositivo mantém um cache para uso rápido e offline.
            </p>

            <div className="p-3.5 bg-sunken rounded-2xl border border-line flex items-center justify-between text-xs">
              <span className="flex items-center space-x-2 text-ink-muted">
                <Cloud className="w-4 h-4 text-primary dark:text-primary" />
                <span>
                  {isSyncing
                    ? 'Sincronizando agora...'
                    : syncError
                      ? 'Sincronização pendente'
                      : 'Tudo sincronizado'}
                </span>
              </span>
              <span className="text-[11px] text-ink-subtle flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{lastSyncedLabel || 'aguardando'}</span>
              </span>
            </div>

            {syncError && (
              <div className="p-3 bg-warning-soft dark:bg-warning-soft/40 text-warning dark:text-warning rounded-xl text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{syncError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => void syncWithCloud()}
              disabled={isSyncing}
              className="py-2 px-4 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-60 text-on-primary text-xs font-medium flex items-center space-x-2 shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3.5 bg-sunken rounded-2xl border border-line text-xs text-ink-muted space-y-1.5 leading-relaxed">
              <p className="font-semibold text-ink flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-primary dark:text-primary shrink-0" />
                <span>100% dos dados residem neste aparelho</span>
              </p>
              <p>
                O Supabase está desativado neste ambiente. Tudo fica apenas neste dispositivo, sem
                envio de registros para a nuvem.
              </p>
            </div>

            <p className="text-[11px] text-ink-subtle leading-relaxed">
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
      <div className="bg-raised p-6 rounded-3xl border border-line shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-serif font-medium text-ink">
            Módulos Ativos
          </h3>
          <p className="text-xs text-ink-muted">
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
                className="flex items-center justify-between p-3 rounded-2xl bg-sunken border border-line cursor-pointer transition hover:bg-sunken"
              >
                <span className="text-xs font-medium text-ink">
                  {item.label}
                </span>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                    isChecked
                      ? 'bg-primary text-on-primary'
                      : 'border border-line-strong bg-raised'
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
      <div className="bg-raised p-6 rounded-3xl border border-line shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-primary dark:text-primary" />
          <h3 className="text-sm font-serif font-medium text-ink">
            Bloqueio & Privacidade
          </h3>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sunken border border-line">
          <div>
            <p className="text-xs font-medium text-ink">
              PIN de 4 dígitos
            </p>
            <p className="text-[11px] text-ink-muted">
              {hasPin ? 'Bloqueio ativado' : 'Sem bloqueio ativo'} · fica apenas neste dispositivo
            </p>
          </div>

          {hasPin ? (
            <button
              type="button"
              onClick={handleRemovePin}
              className="py-1.5 px-3 rounded-xl border border-line-strong text-ink-muted text-xs hover:bg-sunken-strong"
            >
              Remover PIN
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowPinSetup(true)}
              className="py-1.5 px-3 rounded-xl bg-primary text-on-primary text-xs font-medium hover:bg-primary-hover"
            >
              Criar PIN
            </button>
          )}
        </div>

        {showPinSetup && (
          <div className="p-4 bg-primary-soft dark:bg-primary-soft/30 rounded-2xl border border-primary/25 dark:border-primary/25 space-y-3">
            <p className="text-xs text-ink-muted font-medium">
              Digite o novo PIN numérico de 4 dígitos:
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(event) => setPinInput(event.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="w-24 p-2 text-center tracking-widest text-lg font-mono rounded-xl border border-primary/25 dark:border-primary/25 bg-raised"
              />
              <button
                type="button"
                onClick={handleSavePin}
                disabled={pinInput.length !== 4}
                className="py-2 px-4 rounded-xl bg-primary disabled:opacity-50 text-on-primary text-xs font-medium"
              >
                {pinSuccess ? 'Salvo!' : 'Salvar PIN'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPinSetup(false);
                  setPinInput('');
                }}
                className="py-2 px-3 text-ink-muted text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lembretes */}
      <div className="bg-raised p-6 rounded-3xl border border-line shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-ink-subtle" />
          <h3 className="text-sm font-serif font-medium text-ink">
            Lembretes Voluntários
          </h3>
        </div>
        <p className="text-xs text-ink-muted">
          Por princípio de não-pressão, lembretes permanecem desativados até que você decida
          ativá-los.
        </p>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sunken border border-line">
          <span className="text-xs font-medium text-ink">
            Lembrete diário suave
          </span>
          <button
            type="button"
            onClick={() => updatePreferences({ notificationsEnabled: !preferences.notificationsEnabled })}
            className={`py-1 px-3 rounded-xl text-xs font-medium transition ${
              preferences.notificationsEnabled
                ? 'bg-primary text-on-primary'
                : 'bg-sunken-strong text-ink-muted'
            }`}
          >
            {preferences.notificationsEnabled ? 'Ativado' : 'Desativado'}
          </button>
        </div>
      </div>

      {/* Exportar, importar e preservar */}
      <div className="bg-raised p-6 rounded-3xl border border-line shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Download className="w-4 h-4 text-primary dark:text-primary" />
          <h3 className="text-sm font-serif font-medium text-ink">
            Exportar & Preservar Dados
          </h3>
        </div>
        <p className="text-xs text-ink-muted">
          Seus dados pertencem a você. Exporte ou restaure um arquivo completo a qualquer momento.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex-1 py-2.5 px-4 rounded-2xl border border-line-strong hover:bg-sunken text-xs font-medium text-ink flex items-center justify-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Exportar tudo (JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 py-2.5 px-4 rounded-2xl border border-line-strong hover:bg-sunken text-xs font-medium text-ink flex items-center justify-center space-x-2 transition"
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
            className="flex-1 py-2.5 px-4 rounded-2xl border border-line-strong hover:bg-sunken disabled:opacity-60 text-xs font-medium text-ink flex items-center justify-center space-x-2 transition"
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
          <div className="pt-2 border-t border-line space-y-2">
            <p className="text-[11px] text-ink-muted">
              Encontramos dados da versão anterior deste aplicativo neste dispositivo.
            </p>
            <button
              type="button"
              onClick={() => void handleImportLegacy()}
              disabled={isWorking}
              className="py-2 px-4 rounded-xl bg-sunken hover:bg-sunken-strong dark:bg-sunken dark:hover:bg-sunken-strong disabled:opacity-60 text-ink-muted text-xs font-medium"
            >
              Importar dados antigos
            </button>
          </div>
        )}

        {dataError && (
          <div className="p-3 bg-danger-soft dark:bg-danger-soft/40 text-danger dark:text-danger rounded-xl text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{dataError}</span>
          </div>
        )}

        {dataMessage && (
          <div className="p-3 bg-primary-soft dark:bg-primary-soft/40 text-primary dark:text-primary rounded-xl text-xs flex items-start space-x-2">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{dataMessage}</span>
          </div>
        )}

        <div className="pt-2 border-t border-line flex items-center justify-between">
          <span className="text-xs text-ink-subtle">Quer testar com dados de exemplo?</span>
          <button
            type="button"
            onClick={() => void handleDemoData()}
            disabled={isWorking}
            className="py-1.5 px-3 rounded-xl bg-sunken hover:bg-sunken-strong dark:bg-sunken dark:hover:bg-sunken-strong disabled:opacity-60 text-ink-muted text-xs font-medium flex items-center space-x-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-warning" />
            <span>Carregar exemplo</span>
          </button>
        </div>
      </div>

      {/* Manifesto */}
      <div className="bg-sunken p-5 rounded-3xl border border-line space-y-2 text-xs text-ink-muted">
        <div className="flex items-center space-x-2 text-ink font-medium">
          <Info className="w-4 h-4 text-primary dark:text-primary" />
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
          className="text-xs text-danger dark:text-danger hover:underline disabled:opacity-60 flex items-center justify-center space-x-1 mx-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>
            {isCloud ? 'Apagar todos os dados (nuvem e dispositivo)' : 'Apagar todos os dados deste dispositivo'}
          </span>
        </button>
        {isCloud && (
          <p className="text-[10px] text-ink-subtle">
            Sua conta de acesso é mantida; os registros são apagados.
          </p>
        )}
      </div>
    </div>
  );
};
