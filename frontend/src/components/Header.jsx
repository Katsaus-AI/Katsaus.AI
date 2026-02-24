import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function Header({ dateTime, onToggleViewingMode, onToggleFullscreen }) {
  const [companyName, setCompanyName] = useState('Ladataan...');

  useEffect(() => {
    let cancelled = false;

    const fetchCompanyName = async () => {
      try {
        const ref = doc(db, 'companies', 'F0yv6ZOuJT8g4Lfc9xyG');
        const snap = await getDoc(ref);

        if (cancelled) return;
        if (!snap.exists()) {
          setCompanyName('Ei löytynyt');
          return;
        }

        const data = snap.data();
        setCompanyName(data.company_name || 'Ei nimeä');
      } catch (error) {
        console.error('Firestore fetch failed:', error);
        if (cancelled) return;
        const code = error?.code || '';
        if (code === 'permission-denied') {
          setCompanyName('Luku estetty (rules)');
          return;
        }
        if (code === 'unavailable') {
          setCompanyName('Firestore ei tavoitettavissa');
          return;
        }
        setCompanyName(code ? `Virhe: ${code}` : 'Virhe haussa');
      }
    };

    fetchCompanyName();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="app-header">
      <span className="app-logo">Firma Oy</span>
      <button
        type="button"
        className="viewing-mode-btn"
        aria-label="Katselutila"
        onClick={onToggleViewingMode}
      >
        👁
      </button>
      <button
        type="button"
        className="fullscreen-btn"
        aria-label="Fullscreen-näkymä"
        onClick={onToggleFullscreen}
      >
        ⛶
      </button>
      <input
        type="text"
        className="company-name-input"
        aria-label="Yrityksen nimi Firestoresta"
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
