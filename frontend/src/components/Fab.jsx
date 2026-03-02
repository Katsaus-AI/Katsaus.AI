import React from 'react';
import { useTranslation } from 'react-i18next';

export function Fab({ onAdd }) {
  const { t } = useTranslation();
  return (
    <div className="fab-container">
      <button
        type="button"
        className="fab-btn"
        id="fab-add"
        aria-label={t('fab.addMessage')}
        onClick={onAdd}
      >
        +
      </button>
    </div>
  );
}
