import React from 'react';
import { escapeHtml } from '../utils';

export function InfoBox({ text, onEdit }) {
  return (
    <div className="info-box">
      <div className="info-box-icon">ℹ️</div>
      <div className="info-box-text">{escapeHtml(text)}</div>
      <button
        type="button"
        className="info-box-edit-btn"
        aria-label="Muokkaa tiivistelmää"
        onClick={onEdit}
      >
        ✏️
      </button>
    </div>
  );
}
