import React from 'react';
import { useTranslation } from 'react-i18next';
import { escapeHtml } from '../utils';

export function InfoBox({ text, onEdit }) {
  const { t } = useTranslation();
  return (
    <div className="info-box">
      <div className="info-box-icon">ℹ️</div>
      <div className="info-box-text">{escapeHtml(text)}</div>
      <button
        type="button"
        className="info-box-edit-btn"
        aria-label={t('infobox.editAria')}
        onClick={onEdit}
      >
        ✏️
      </button>
    </div>
  );
}
