/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Moon, Sun, Shield } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { user, preferences, updatePreferences, hasPin, lockApp } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getFormattedDate = () => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
  };

  const toggleTheme = () => {
    const next = preferences.theme === 'dark' ? 'light' : 'dark';
    updatePreferences({ theme: next });
  };

  return (
    <header className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-line bg-sunken/80 dark:bg-raised/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="space-y-0.5">
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase tracking-wider font-medium text-primary dark:text-primary">
            {getGreeting()}{user?.displayName ? `, ${user.displayName}` : ''}
          </span>
        </div>
        <h1 className="text-lg md:text-xl font-serif font-medium text-ink capitalize">
          {getFormattedDate()}
        </h1>
      </div>

      <div className="flex items-center space-x-2">
        {hasPin && (
          <button
            type="button"
            onClick={lockApp}
            className="p-2 rounded-xl text-ink-muted hover:text-ink dark:hover:text-stone-100 hover:bg-sunken-strong/60 dark:hover:bg-sunken transition"
            title="Bloquear com PIN"
            aria-label="Bloquear aplicativo com PIN"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-ink-muted hover:text-ink dark:hover:text-stone-100 hover:bg-sunken-strong/60 dark:hover:bg-sunken transition"
          title={preferences.theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          aria-label="Alternar tema claro ou escuro"
        >
          {preferences.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-full bg-primary-soft dark:bg-primary-soft/70 border border-primary/25 dark:border-primary/25 flex items-center justify-center text-xs font-semibold text-primary dark:text-primary hover:opacity-90 transition"
          aria-label="Abrir Perfil e Configurações"
        >
          {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : <Shield className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
