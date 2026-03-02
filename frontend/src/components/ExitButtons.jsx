import React from 'react';
import { useTranslation } from 'react-i18next';

export function ExitButtons({ fullscreenMode, viewingMode, onExitFullscreen, onExitViewing }) {
  const { t } = useTranslation();
  return (
    <>
      {fullscreenMode && (
        <button
          type="button"
          className="exit-fullscreen-btn"
          aria-label={t('exitButtons.exitFullscreenAria')}
          onClick={onExitFullscreen}
        >
          ✕ {t('exitButtons.exitFullscreen')}
        </button>
      )}
      {viewingMode && (
        <button
          type="button"
          className="exit-viewing-btn"
          aria-label={t('exitButtons.exitViewingAria')}
          onClick={onExitViewing}
        >
          ✕ {t('exitButtons.exitViewing')}
        </button>
      )}
    </>
  );
}
