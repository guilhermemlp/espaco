/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { SetNewPasswordScreen } from './components/auth/SetNewPasswordScreen';
import { Header } from './components/common/Header';
import { BottomNav, TabType } from './components/common/BottomNav';
import { PinLockModal } from './components/common/PinLockModal';
import { Onboarding } from './components/onboarding/Onboarding';
import { HomeView } from './components/home/HomeView';
import { InsightsView } from './components/insights/InsightsView';
import { JournalView } from './components/journal/JournalView';
import { RecoveryView } from './components/recovery/RecoveryView';
import { SettingsView } from './components/settings/SettingsView';

const SplashScreen: React.FC<{ label?: string }> = ({ label }) => (
  <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50 flex items-center justify-center p-6">
    <div className="flex flex-col items-center space-y-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-inner">
        <Sparkles className="w-8 h-8" />
      </div>
      <div>
        <p className="text-lg font-serif font-medium">Espaço</p>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center justify-center space-x-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{label || 'Preparando seu espaço...'}</span>
        </p>
      </div>
    </div>
  </div>
);

const MainApp: React.FC = () => {
  const { onboardingCompleted, isLocked } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('hoje');

  const [incomingReflection, setIncomingReflection] = useState<{
    tag: 'reflexao';
    title: string;
    content: string;
  } | null>(null);

  const handleReflectInJournal = (reflection: { tag: 'reflexao'; title: string; content: string }) => {
    setIncomingReflection(reflection);
    setActiveTab('diario');
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50 font-sans antialiased selection:bg-emerald-200 dark:selection:bg-emerald-900 transition-colors">
      {/* Centered mobile-optimized layout container */}
      <div className="max-w-lg mx-auto min-h-screen bg-[#FAF9F6] dark:bg-stone-950 flex flex-col relative shadow-xl border-x border-stone-200/50 dark:border-stone-800/60">
        {/* Header */}
        <Header onOpenSettings={() => setActiveTab('perfil')} />

        {/* View Content */}
        <main className="flex-1 px-4 md:px-5 pt-4">
          {activeTab === 'hoje' && <HomeView onNavigateTab={setActiveTab} />}
          {activeTab === 'insights' && <InsightsView />}
          {activeTab === 'diario' && (
            <JournalView
              incomingReflection={incomingReflection}
              onClearIncomingReflection={() => setIncomingReflection(null)}
            />
          )}
          {activeTab === 'recuperacao' && (
            <RecoveryView onReflectInJournal={handleReflectInJournal} />
          )}
          {activeTab === 'perfil' && <SettingsView />}
        </main>

        {/* Bottom Nav */}
        <BottomNav currentTab={activeTab} onSelectTab={setActiveTab} />

        {/* Onboarding modal if not yet completed */}
        {!onboardingCompleted && <Onboarding onComplete={() => undefined} />}

        {/* Local PIN Security Lock */}
        {isLocked && <PinLockModal />}
      </div>
    </div>
  );
};

/**
 * Porteiro de autenticação:
 * 1. Enquanto a sessão é restaurada, mostra um carregamento.
 * 2. Sem sessão no modo Supabase, mostra a tela de entrada.
 * 3. Com sessão (ou modo local), monta os dados do usuário ativo.
 */
const AppGate: React.FC = () => {
  const { user, authLoading, isSupabaseReady, isPasswordRecovery } = useAuth();

  if (authLoading) {
    return <SplashScreen label="Restaurando sua sessão..." />;
  }

  // Chegou por um link de redefinição: pede a nova senha antes de abrir o app.
  if (isPasswordRecovery) {
    return <SetNewPasswordScreen />;
  }

  if (isSupabaseReady && !user) {
    return <AuthScreen />;
  }

  if (!user) {
    return <SplashScreen />;
  }

  return (
    <DataProvider>
      <MainApp />
    </DataProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}
