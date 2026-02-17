import React from 'react';
import { THEMES } from '../utils';

const LABELS = {
  light: 'Vaalea',
  teletext: 'Teksti-TV',
  youth: 'Nuorisoversio',
  business: 'Business',
};

const ARIA_LABELS = {
  light: 'Vaalea teema',
  teletext: 'Teksti-TV teema',
  youth: 'Nuorisoversio teema',
  business: 'Business teema',
};

export function ThemeSelector({ theme, setTheme }) {
  return (
    <div className="theme-selector">
      {Object.entries(THEMES).map(([, value]) => (
        <button
          key={value}
          type="button"
          className={`theme-selector-btn ${theme === value ? 'active' : ''}`}
          data-theme={value}
          aria-label={ARIA_LABELS[value]}
          onClick={() => setTheme(value)}
        >
          {LABELS[value]}
        </button>
      ))}
    </div>
  );
}
