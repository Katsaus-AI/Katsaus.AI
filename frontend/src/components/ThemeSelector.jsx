import React from 'react';
import { THEMES } from '../utils';

const LABELS = {
  default: 'Default',
  light: 'Vaalea',
  teletext: 'Teksti-TV',
  youth: 'Nuorisoversio',
  business: 'Business',
};

const ARIA_LABELS = {
  default: 'Default teema',
  light: 'Vaalea teema',
  teletext: 'Teksti-TV teema',
  youth: 'Nuorisoversio teema',
  business: 'Business teema',
};

export function ThemeSelector({ theme, setTheme, themeSelectorVisible }) {
  // Piilotetaan kokonaan default-teemassa jos ei ole avattu
  if (theme === 'default' && !themeSelectorVisible) {
    return null;
  }

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
