import React from 'react';
import { useTranslation } from 'react-i18next';

export function InfoboxModal({ isOpen, infoBoxText, onClose, onSubmit }) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div
      className="modal"
      id="infobox-modal"
      style={{ display: 'flex' }}
      onClick={(e) => e.target.id === 'infobox-modal' && onClose()}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{t('infobox.editTitle')}</h2>
          <button type="button" className="modal-close" aria-label={t('messageModal.close')} onClick={onClose}>
            &times;
          </button>
        </div>
        <form id="infobox-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="infobox-text">{t('infobox.summary')}</label>
            <textarea
              id="infobox-text"
              name="infoboxText"
              rows={4}
              maxLength={500}
              required
              placeholder={t('infobox.summaryPlaceholder')}
              defaultValue={infoBoxText}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              {t('messageModal.cancel')}
            </button>
            <button type="submit" className="btn-submit">
              {t('messageModal.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
