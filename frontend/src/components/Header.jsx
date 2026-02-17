import React from 'react';

export function Header({ dateTime, onToggleViewingMode, onToggleFullscreen }) {
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
      <div className="header-time">
        <span className="time">{dateTime.time}</span>
        <span className="date">{dateTime.date}</span>
      </div>
    </header>
  );
}
