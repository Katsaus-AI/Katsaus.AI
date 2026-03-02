import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function Header({ dateTime, onToggleViewingMode, onToggleFullscreen }) {
  const { t, i18n } = useTranslation();
  const [companyName, setCompanyName] = useState(t('header.loading'));

  useEffect(() => {
    let cancelled = false;

    const fetchCompanyName = async () => {
      try {
        const ref = doc(db, 'companies', 'F0yv6ZOuJT8g4Lfc9xyG');
        const snap = await getDoc(ref);

        if (cancelled) return;
        if (!snap.exists()) {
          setCompanyName(i18n.t('header.notFound'));
          return;
        }

        const data = snap.data();
        setCompanyName(data.company_name || i18n.t('header.noName'));
      } catch (error) {
        console.error('Firestore fetch failed:', error);
        if (cancelled) return;
        const code = error?.code || '';
        if (code === 'permission-denied') {
          setCompanyName(i18n.t('header.permissionDenied'));
          return;
        }
        if (code === 'unavailable') {
          setCompanyName(i18n.t('header.firestoreUnavailable'));
          return;
        }
        setCompanyName(code ? i18n.t('header.errorCode', { code }) : i18n.t('header.error'));
      }
    };

    fetchCompanyName();

    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  return (
    <header className="app-header">
      <span className="app-logo">{t('header.companyPlaceholder')}</span>
      <div className="lang-switcher">
        <button
          type="button"
          className={`lang-btn ${i18n.language === 'fi' ? 'active' : ''}`}
          onClick={() => i18n.changeLanguage('fi')}
          aria-label="Suomi"
        >
          FI
        </button>
        <button
          type="button"
          className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
          onClick={() => i18n.changeLanguage('en')}
          aria-label="English"
        >
          EN
        </button>
      </div>
      <button
        type="button"
        className="viewing-mode-btn"
        aria-label={t('header.viewingMode')}
        onClick={onToggleViewingMode}
      >
        👁
      </button>
      <button
        type="button"
        className="fullscreen-btn"
        aria-label={t('header.fullscreen')}
        onClick={onToggleFullscreen}
      >
        ⛶
      </button>
      <input
        type="text"
        className="company-name-input"
        aria-label={t('header.companyNameAria')}
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
      />
      <div className="header-time">
        <span className="time">{dateTime.time}</span>
        <span className="date">{dateTime.date}</span>
      </div>
    </header>
  );
}
