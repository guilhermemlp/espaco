/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Delete, ShieldAlert } from 'lucide-react';

export const PinLockModal: React.FC = () => {
  const { unlockWithPin } = useAuth();
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        const success = unlockWithPin(nextPin);
        if (!success) {
          setError(true);
          setTimeout(() => {
            setPinInput('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setPinInput(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/95 backdrop-blur-md p-4 text-stone-100">
      <div className="w-full max-w-xs text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-stone-800/80 border border-stone-700/80 flex items-center justify-center mx-auto text-emerald-400">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-serif font-medium text-stone-100">
            Espaço Protegido
          </h2>
          <p className="text-xs text-stone-400">
            Digite seu PIN de 4 dígitos para desbloquear.
          </p>
        </div>

        {/* Dots */}
        <div className="flex justify-center space-x-4 my-4">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                error
                  ? 'border-rose-500 bg-rose-500 animate-shake'
                  : i < pinInput.length
                  ? 'bg-emerald-400 border-emerald-400 scale-110'
                  : 'border-stone-600 bg-stone-800'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-center space-x-1.5 text-xs text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <span>PIN incorreto. Tente novamente.</span>
          </div>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-stone-800/60 hover:bg-stone-700/80 active:bg-stone-700 text-lg font-medium text-stone-100 border border-stone-700/40 transition active:scale-95"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-stone-800/60 hover:bg-stone-700/80 active:bg-stone-700 text-lg font-medium text-stone-100 border border-stone-700/40 transition active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-stone-800/30 hover:bg-stone-800/60 active:bg-stone-700 text-stone-300 border border-stone-800 flex items-center justify-center transition active:scale-95"
            aria-label="Apagar dígito"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
