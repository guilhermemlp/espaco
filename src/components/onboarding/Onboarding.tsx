/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Heart, 
  Moon, 
  Flame, 
  BookOpen, 
  Compass, 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  User, 
  Mail 
} from 'lucide-react';
import { ActiveModules } from '../../types';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { completeOnboarding, loginWithEmail, loginAsGuest } = useAuth();
  const [step, setStep] = useState<number>(1);

  // Consent state
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(true);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState<boolean>(true);

  // Active modules state
  const [modules, setModules] = useState<ActiveModules>({
    mood: true,
    sleep: true,
    behaviors: true,
    journal: true,
    recovery: true,
  });

  // Auth form
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleFinish = (isGuest = false) => {
    if (isGuest || !email.trim()) {
      loginAsGuest();
    } else {
      loginWithEmail(email, displayName);
    }
    completeOnboarding(
      { activeModules: modules },
      {
        acceptedTerms,
        acceptedPrivacy,
        acceptedAt: new Date().toISOString(),
      }
    );
    onComplete();
  };

  const toggleModule = (key: keyof ActiveModules) => {
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 rounded-3xl shadow-2xl border border-stone-200/80 dark:border-stone-800 p-6 md:p-8 transition-all">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1.5">
            {[1, 2, 3, 4, 5].map(idx => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === step
                    ? 'w-8 bg-emerald-600 dark:bg-emerald-500'
                    : idx < step
                    ? 'w-4 bg-emerald-300 dark:bg-emerald-800'
                    : 'w-4 bg-stone-200 dark:bg-stone-800'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-stone-400">
            Passo {step} de 5
          </span>
        </div>

        {/* STEP 1: Boas-vindas */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="text-center space-y-3">
              <h1 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-50">
                Um espaço só seu para se observar
              </h1>
              <p className="text-sm md:text-base text-stone-600 dark:text-stone-300 leading-relaxed max-w-md mx-auto">
                Uma plataforma privada, gentil e flexível para registrar experiências, acolher suas oscilações e acompanhar sua jornada no seu próprio ritmo.
              </p>
            </div>

            <div className="bg-stone-100 dark:bg-stone-800/70 p-4 rounded-2xl border border-stone-200/50 dark:border-stone-700/50 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                O que acreditamos
              </p>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Observar a própria vida não deve vir acompanhado de cobrança, julgamento, streaks punitivos ou diagnósticos automáticos.
              </p>
            </div>

            <div className="pt-2 flex flex-col space-y-3">
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.99]"
              >
                <span>Conhecer o Espaço</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: O que você pode registrar */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-50">
                O que você pode acompanhar
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Tudo é opcional e você pode desativar o que não usar.
              </p>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100">Humor & Emoções</h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">Check-in em 1 toque, energia, ansiedade e palavras do momento.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 shrink-0 mt-0.5">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100">Sono</h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">Duração e qualidade percebida, sem cobrança de metas rígidas.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100">Impulsos & Comportamentos</h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">Separação clara entre a vontade sentida e o que você de fato fez.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100">Diário Íntimo</h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">Espaço de escrita livre, protegido e sem leitura por terceiros.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100">Jornada de Recuperação</h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">Marcos sem competição. Em caso de reinício, seu histórico é sempre preservado.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-sm font-medium transition"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition"
              >
                <span>Avançar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Privacidade e Limites */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-50">
                Privacidade & Limites Éticos
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Compromissos inegociáveis para a sua segurança emocional.
              </p>
            </div>

            <div className="bg-stone-100 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200/70 dark:border-stone-700/70 space-y-3 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
              <div className="flex items-start space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p><strong className="text-stone-800 dark:text-stone-100">Não fornecemos diagnósticos:</strong> Este aplicativo não substitui acompanhamento médico, psiquiátrico ou psicológico.</p>
              </div>
              <div className="flex items-start space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p><strong className="text-stone-800 dark:text-stone-100">Sem compartilhamento:</strong> Seus dados residem no seu dispositivo e você pode exportá-los ou apagá-los quando desejar.</p>
              </div>
              <div className="flex items-start space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p><strong className="text-stone-800 dark:text-stone-100">Zero punição:</strong> Não há penalidades, contadores regressivos nem mensagens de culpa.</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-center space-x-3 cursor-pointer text-xs text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
                <span>Compreendo a finalidade de auto-observação não médica do aplicativo.</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer text-xs text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
                <span>Concordo com os termos de privacidade local.</span>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between space-x-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-4 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-sm font-medium transition"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!acceptedTerms || !acceptedPrivacy}
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-emerald-700 disabled:opacity-50 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition"
              >
                <span>Concordar e continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Escolha de Módulos */}
        {step === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-50">
                Escolha o que deseja acompanhar
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Você pode ligar ou desligar qualquer módulo mais tarde nas configurações.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'mood', label: 'Humor & Sentimentos', desc: 'Check-in rápido, energia e ansiedade' },
                { key: 'sleep', label: 'Sono & Repouso', desc: 'Duração e qualidade percebida' },
                { key: 'behaviors', label: 'Impulsos & Comportamentos', desc: 'Vontade vs Ocorrência vs Controle' },
                { key: 'journal', label: 'Diário Pessoal', desc: 'Espaço aberto para desabafos e reflexões' },
                { key: 'recovery', label: 'Jornada de Recuperação', desc: 'Contador acolhedor, marcos e atividades' },
              ].map(item => {
                const k = item.key as keyof ActiveModules;
                const active = modules[k];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleModule(k)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                        : 'bg-stone-100 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 opacity-60'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{item.label}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">{item.desc}</p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                        active
                          ? 'bg-emerald-600 text-white'
                          : 'border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800'
                      }`}
                    >
                      {active && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between space-x-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-3 px-4 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-sm font-medium transition"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition"
              >
                <span>Definir módulos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Criar Conta / Entrar */}
        {step === 5 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-50">
                Como prefere iniciar?
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Você pode criar uma conta local com seu nome/e-mail ou usar o modo anônimo instantâneo.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3 bg-stone-100 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-700/60">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Identificação opcional
                </p>
                <div>
                  <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1">
                    Como gostaria de ser chamado(a)?
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Ex: Clara, Lucas ou deixe em branco"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1">
                    E-mail (opcional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      placeholder="seu.email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleFinish(false)}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.99]"
              >
                <span>Começar meu espaço</span>
                <Check className="w-4 h-4" />
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                <span className="flex-shrink mx-4 text-xs text-stone-400 uppercase tracking-widest">ou</span>
                <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
              </div>

              <button
                type="button"
                onClick={() => handleFinish(true)}
                className="w-full py-3 px-4 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium flex items-center justify-center space-x-2 transition"
              >
                <Lock className="w-4 h-4 text-stone-400" />
                <span>Continuar em modo anônimo local (100% privado)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
