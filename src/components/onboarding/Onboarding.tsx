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
  Sparkles 
} from 'lucide-react';
import { ActiveModules } from '../../types';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState<number>(1);

  // Consentimento explícito: nada pré-marcado.
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState<boolean>(false);

  // Active modules state
  const [modules, setModules] = useState<ActiveModules>({
    mood: true,
    sleep: true,
    behaviors: true,
    journal: true,
    recovery: true,
  });

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleFinish = () => {
    if (!acceptedTerms || !acceptedPrivacy) return;

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
      <div className="w-full max-w-lg bg-sunken dark:bg-raised text-ink rounded-3xl shadow-2xl border border-line p-6 md:p-8 transition-all">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1.5">
            {[1, 2, 3, 4].map(idx => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === step
                    ? 'w-8 bg-primary dark:bg-primary'
                    : idx < step
                    ? 'w-4 bg-primary/30 dark:bg-primary/30'
                    : 'w-4 bg-sunken-strong dark:bg-sunken'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-ink-subtle">
            Passo {step} de 4
          </span>
        </div>

        {/* STEP 1: Boas-vindas */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-primary-soft dark:bg-primary-soft/60 text-primary dark:text-primary flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="text-center space-y-3">
              <h1 className="text-2xl font-serif font-medium text-ink">
                Um espaço só seu para se observar
              </h1>
              <p className="text-sm md:text-base text-ink-muted leading-relaxed max-w-md mx-auto">
                Uma plataforma privada, gentil e flexível para registrar experiências, acolher suas oscilações e acompanhar sua jornada no seu próprio ritmo.
              </p>
            </div>

            <div className="bg-sunken p-4 rounded-2xl border border-line/50 dark:border-line-strong/50 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                O que acreditamos
              </p>
              <p className="text-sm text-ink-muted">
                Observar a própria vida não deve vir acompanhado de cobrança, julgamento, streaks punitivos ou diagnósticos automáticos.
              </p>
            </div>

            <div className="pt-2 flex flex-col space-y-3">
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-hover dark:bg-primary text-on-primary font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.99]"
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
              <h2 className="text-xl font-serif font-medium text-ink">
                O que você pode acompanhar
              </h2>
              <p className="text-xs text-ink-muted">
                Tudo é opcional e você pode desativar o que não usar.
              </p>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              <div className="p-3.5 rounded-2xl bg-sunken border border-line/60 dark:border-line-strong/60 flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-warning-soft dark:bg-warning-soft/60 text-warning dark:text-warning shrink-0 mt-0.5">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-ink">Humor & Emoções</h3>
                  <p className="text-xs text-ink-muted mt-0.5">Check-in em 1 toque, energia, ansiedade e palavras do momento.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sunken border border-line/60 dark:border-line-strong/60 flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-info-soft dark:bg-info-soft/60 text-info dark:text-info shrink-0 mt-0.5">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-ink">Sono</h3>
                  <p className="text-xs text-ink-muted mt-0.5">Duração e qualidade percebida, sem cobrança de metas rígidas.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sunken border border-line/60 dark:border-line-strong/60 flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-danger-soft dark:bg-danger-soft/60 text-danger dark:text-danger shrink-0 mt-0.5">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-ink">Impulsos & Comportamentos</h3>
                  <p className="text-xs text-ink-muted mt-0.5">Separação clara entre a vontade sentida e o que você de fato fez.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sunken border border-line/60 dark:border-line-strong/60 flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-primary-soft dark:bg-primary-soft/60 text-primary dark:text-primary shrink-0 mt-0.5">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-ink">Diário Íntimo</h3>
                  <p className="text-xs text-ink-muted mt-0.5">Espaço de escrita livre, protegido e sem leitura por terceiros.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sunken border border-line/60 dark:border-line-strong/60 flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-accent-soft dark:bg-accent-soft/60 text-accent dark:text-accent shrink-0 mt-0.5">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-ink">Jornada de Recuperação</h3>
                  <p className="text-xs text-ink-muted mt-0.5">Marcos sem competição. Em caso de reinício, seu histórico é sempre preservado.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 text-ink-muted hover:text-ink text-sm font-medium transition"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-primary hover:bg-primary-hover dark:bg-primary text-on-primary font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition"
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
            <div className="w-14 h-14 rounded-2xl bg-accent-soft dark:bg-accent-soft/60 text-accent dark:text-accent flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-serif font-medium text-ink">
                Privacidade & Limites Éticos
              </h2>
              <p className="text-xs text-ink-muted">
                Compromissos inegociáveis para a sua segurança emocional.
              </p>
            </div>

            <div className="bg-sunken p-4 rounded-2xl border border-line/70 dark:border-line-strong/70 space-y-3 text-xs leading-relaxed text-ink-muted">
              <div className="flex items-start space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p><strong className="text-ink">Não fornecemos diagnósticos:</strong> Este aplicativo não substitui acompanhamento médico, psiquiátrico ou psicológico.</p>
              </div>
              <div className="flex items-start space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p><strong className="text-ink">Sem compartilhamento:</strong> Seus dados ficam vinculados à sua conta, protegidos por regras de acesso por usuário. Você pode exportá-los ou apagá-los quando desejar.</p>
              </div>
              <div className="flex items-start space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p><strong className="text-ink">Zero punição:</strong> Não há penalidades, contadores regressivos nem mensagens de culpa.</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-center space-x-3 cursor-pointer text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 border-line-strong bg-sunken"
                />
                <span>Compreendo a finalidade de auto-observação não médica do aplicativo.</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 border-line-strong bg-sunken"
                />
                <span>Concordo com os termos de privacidade e com o armazenamento seguro dos meus dados na minha conta.</span>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between space-x-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-4 text-ink-muted hover:text-ink text-sm font-medium transition"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!acceptedTerms || !acceptedPrivacy}
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-primary disabled:opacity-50 hover:bg-primary-hover dark:bg-primary text-on-primary font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition"
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
              <h2 className="text-xl font-serif font-medium text-ink">
                Escolha o que deseja acompanhar
              </h2>
              <p className="text-xs text-ink-muted">
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
                        ? 'bg-primary-soft/70 dark:bg-primary-soft/30 border-primary/25 dark:border-primary/25'
                        : 'bg-sunken border-line opacity-60'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{item.label}</p>
                      <p className="text-xs text-ink-muted">{item.desc}</p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                        active
                          ? 'bg-primary text-on-primary'
                          : 'border border-line-strong bg-raised'
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
                className="py-3 px-4 text-ink-muted hover:text-ink text-sm font-medium transition"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={!acceptedTerms || !acceptedPrivacy}
                className="flex-1 py-3 px-6 rounded-2xl bg-primary hover:bg-primary-hover dark:bg-primary disabled:opacity-50 text-on-primary font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition"
              >
                <span>Começar meu espaço</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
