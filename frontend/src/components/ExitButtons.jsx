import React from 'react';

export function ExitButtons({ fullscreenMode, viewingMode, onExitFullscreen, onExitViewing }) {
  return (
    <>
      {fullscreenMode && (
        <button
          type="button"
          className="exit-fullscreen-btn"
          aria-label="Poistu fullscreen-näkymästä"
          onClick={onExitFullscreen}
        >
          ✕ Poistu fullscreen
        </button>
      )}
      {viewingMode && (
        <button
          type="button"
          className="exit-viewing-btn"
          aria-label="Poistu katselutilasta"
          onClick={onExitViewing}
        >
          ✕ Poistu katselutilasta
        </button>
      )}
    </>
  );
}
