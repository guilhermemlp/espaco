/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { Header } from './components/common/Header';
import { BottomNav, TabType } from './components/common/BottomNav';
import { PinLockModal } from './components/common/PinLockModal';
import { Onboarding } from './components/onboarding/Onboarding';
import { HomeView } from './components/home/HomeView';
import { InsightsView } from './components/insights/InsightsView';
import { JournalView } from './components/journal/JournalView';
import { RecoveryView } from './components/recovery/RecoveryView';
import { SettingsView } from './components/settings/SettingsView';

const MainApp: React.FC = () => {
  const { onboardingCompleted, isLocked } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('hoje');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!onboardingCompleted);

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
        {showOnboarding && (
          <Onboarding onComplete={() => setShowOnboarding(false)} />
        )}

        {/* Local PIN Security Lock */}
        {isLocked && <PinLockModal />}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
