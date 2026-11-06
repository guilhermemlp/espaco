/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, LineChart, BookOpen, Compass, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export type TabType = 'hoje' | 'insights' | 'diario' | 'recuperacao' | 'perfil';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { preferences } = useAuth();
  const { activeModules } = preferences;

  const navItems: { id: TabType; label: string; icon: React.ReactNode; visible: boolean }[] = [
    {
      id: 'hoje',
      label: 'Hoje',
      icon: <Home className="w-5 h-5" />,
      visible: true,
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: <LineChart className="w-5 h-5" />,
      visible: true,
    },
    {
      id: 'diario',
      label: 'Diário',
      icon: <BookOpen className="w-5 h-5" />,
      visible: activeModules.journal,
    },
    {
      id: 'recuperacao',
      label: 'Jornada',
      icon: <Compass className="w-5 h-5" />,
      visible: activeModules.recovery,
    },
    {
      id: 'perfil',
      label: 'Perfil',
      icon: <User className="w-5 h-5" />,
      visible: true,
    },
  ];

  const visibleItems = navItems.filter(item => item.visible);

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-lg border-t border-stone-200/60 dark:border-stone-800/80 px-2 py-1.5 z-40 transition-colors">
      <div className="flex items-center justify-around">
        {visibleItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-2xl transition duration-200 ${
                isActive
                  ? 'text-emerald-800 dark:text-emerald-400 font-medium'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
              aria-label={`Aba ${item.label}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`p-1 rounded-xl transition duration-200 ${
                  isActive ? 'bg-emerald-100/70 dark:bg-emerald-950/60 scale-105' : ''
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
