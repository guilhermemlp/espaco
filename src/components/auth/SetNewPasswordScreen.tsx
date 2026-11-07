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
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50 font-sans antialiased flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md bg-[#FAF9F6] dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-200/80 dark:border-stone-800 p-6 md:p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-medium tracking-tight">Definir nova senha</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {user?.email
                ? `Escolha uma senha nova para ${user.email}.`
                : 'Escolha uma senha nova para a sua conta.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-2xl text-sm flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Senha atualizada. Abrindo o seu espaço...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-stone-600 dark:text-stone-300 block mb-1">
                Nova senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
                  aria-label="Nova senha"
                  autoComplete="new-password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-600 dark:text-stone-300 block mb-1">
                Repita a nova senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder="Digite novamente"
                  aria-label="Repita a nova senha"
                  autoComplete="new-password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.99]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{loading ? 'Salvando...' : 'Salvar nova senha'}</span>
            </button>

            <button
              type="button"
              onClick={dismissPasswordRecovery}
              className="w-full text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 pt-1"
            >
              Agora não
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
