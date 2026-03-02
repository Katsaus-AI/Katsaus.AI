import React from 'react';
import { useTranslation } from 'react-i18next';
import { THEMES } from '../utils';

const THEME_KEYS = {
  light: 'themes.light',
  teletext: 'themes.teletext',
  youth: 'themes.youth',
  business: 'themes.business',
};

const THEME_ARIA_KEYS = {
  light: 'themes.lightAria',
  teletext: 'themes.teletextAria',
  youth: 'themes.youthAria',
  business: 'themes.businessAria',
};

export function ThemeSelector({ theme, setTheme }) {
  const { t } = useTranslation();
  return (
    <div className="theme-selector">
      {Object.entries(THEMES).map(([, value]) => (
        <button
          key={value}
          type="button"
          className={`theme-selector-btn ${theme === value ? 'active' : ''}`}
          data-theme={value}
          aria-label={t(THEME_ARIA_KEYS[value])}
          onClick={() => setTheme(value)}
        >
          {t(THEME_KEYS[value])}
        </button>
      ))}
    </div>
  );
}
