/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tela de entrada quando o Supabase está configurado.
 * Login, criação de conta e acesso por link mágico (sem senha).
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MIN_PASSWORD_LENGTH, validatePassword } from '../../utils/password';

type AuthMode = 'login' | 'signup' | 'magic' | 'reset';

export const AuthScreen: React.FC = () => {
  const {
    signInWithSupabase,
    signUpWithSupabase,
    signInWithMagicLink,
    requestPasswordReset,
    isSupabaseReady,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await signInWithSupabase(email, password);
      } else if (mode === 'signup') {
        const passwordError = validatePassword(password);
        if (passwordError) {
          setError(passwordError);
          return;
        }
        result = await signUpWithSupabase(email, password, displayName);
      } else if (mode === 'reset') {
        result = await requestPasswordReset(email);
      } else {
        result = await signInWithMagicLink(email);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.message) {
        setMessage(result.message);
        if (mode === 'magic' || mode === 'reset') setPassword('');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível concluir agora. Tente novamente em instantes.',
      );
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === 'login'
      ? 'Entrar no seu espaço'
      : mode === 'signup'
        ? 'Criar seu espaço'
        : mode === 'reset'
          ? 'Recuperar acesso'
          : 'Entrar sem senha';

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50 font-sans antialiased flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md bg-[#FAF9F6] dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-200/80 dark:border-stone-800 p-6 md:p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-medium tracking-tight">Espaço</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Um lugar privado para se observar, no seu ritmo.
            </p>
          </div>
        </div>

        {!isSupabaseReady ? (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            O login na nuvem não está configurado neste ambiente. Defina
            <code className="mx-1 font-mono">VITE_SUPABASE_URL</code> e
            <code className="mx-1 font-mono">VITE_SUPABASE_ANON_KEY</code>
            para ativar as contas.
          </div>
        ) : (
          <>
            <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl text-xs">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 rounded-xl font-medium transition ${
                  mode === 'login' || mode === 'reset'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2 rounded-xl font-medium transition ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                Criar conta
              </button>
              <button
                type="button"
                onClick={() => switchMode('magic')}
                className={`flex-1 py-2 rounded-xl font-medium transition ${
                  mode === 'magic'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                Sem senha
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-serif font-medium">{title}</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {mode === 'magic'
                  ? 'Enviaremos um link de acesso para o seu e-mail. Sem senha para lembrar.'
                  : mode === 'reset'
                    ? 'Enviaremos um link para você definir uma nova senha. O link abre neste navegador.'
                    : 'Seus registros ficam vinculados apenas à sua conta, com acesso protegido por usuário.'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="text-xs font-medium text-stone-600 dark:text-stone-300 block mb-1">
                    Como quer ser chamado(a)?
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Opcional"
                      aria-label="Como quer ser chamado"
                      autoComplete="nickname"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-stone-600 dark:text-stone-300 block mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu@email.com"
                    aria-label="E-mail"
                    autoComplete="email"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {mode !== 'magic' && mode !== 'reset' && (
                <div>
                  <label className="text-xs font-medium text-stone-600 dark:text-stone-300 block mb-1">
                    Senha
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
                      aria-label="Senha"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      className="mt-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.99]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'magic' || mode === 'reset' ? (
                  <KeyRound className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>
                  {loading
                    ? 'Aguarde...'
                    : mode === 'login'
                      ? 'Entrar'
                      : mode === 'signup'
                        ? 'Criar conta'
                        : mode === 'reset'
                          ? 'Enviar link de redefinição'
                          : 'Enviar link de acesso'}
                </span>
              </button>
            </form>

            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                Voltar para entrar
              </button>
            )}
          </>
        )}

        <div className="pt-2 border-t border-stone-200/80 dark:border-stone-800 space-y-2">
          <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-start space-x-2 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Seus dados são protegidos por regras de acesso por usuário. O PIN de bloqueio
              permanece apenas neste dispositivo e nunca é enviado para a nuvem.
            </span>
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 leading-relaxed">
            Este aplicativo não fornece diagnósticos e não substitui acompanhamento profissional.
          </p>
        </div>
      </div>
    </div>
  );
};
