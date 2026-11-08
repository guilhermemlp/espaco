/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tela exibida quando o usuário chega por um link de redefinição de senha.
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MIN_PASSWORD_LENGTH, validatePassword } from '../../utils/password';

export const SetNewPasswordScreen: React.FC = () => {
  const { updatePassword, dismissPasswordRecovery, user } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmation) {
      setError('As duas senhas precisam ser iguais.');
      return;
    }

    setLoading(true);
    try {
      const result = await updatePassword(password);
      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setPassword('');
      setConfirmation('');
      window.setTimeout(() => dismissPasswordRecovery(), 1600);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível atualizar a senha. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-ink font-sans antialiased flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md bg-raised rounded-3xl shadow-xl border border-line p-6 md:p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary-soft dark:bg-primary-soft/60 text-primary dark:text-primary flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-medium tracking-tight">Definir nova senha</h1>
            <p className="text-sm text-ink-muted mt-1">
              {user?.email
                ? `Escolha uma senha nova para ${user.email}.`
                : 'Escolha uma senha nova para a sua conta.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-danger-soft dark:bg-danger-soft/40 text-danger dark:text-danger rounded-xl text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-4 bg-primary-soft dark:bg-primary-soft/40 text-primary dark:text-primary rounded-2xl text-sm flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Senha atualizada. Abrindo o seu espaço...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-ink-muted block mb-1">
                Nova senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
                  aria-label="Nova senha"
                  autoComplete="new-password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-line-strong bg-raised text-sm placeholder-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted block mb-1">
                Repita a nova senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder="Digite novamente"
                  aria-label="Repita a nova senha"
                  autoComplete="new-password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-line-strong bg-raised text-sm placeholder-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-hover dark:bg-primary disabled:opacity-60 text-on-primary font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.99]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{loading ? 'Salvando...' : 'Salvar nova senha'}</span>
            </button>

            <button
              type="button"
              onClick={dismissPasswordRecovery}
              className="w-full text-xs text-ink-muted hover:text-ink pt-1"
            >
              Agora não
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
