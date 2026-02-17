import React from 'react';

export function InfoboxModal({ isOpen, infoBoxText, onClose, onSubmit }) {
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
          <h2 className="modal-title">Muokkaa tiivistelmää</h2>
          <button type="button" className="modal-close" aria-label="Sulje" onClick={onClose}>
            &times;
          </button>
        </div>
        <form id="infobox-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="infobox-text">Tiivistelmä</label>
            <textarea
              id="infobox-text"
              name="infoboxText"
              rows={4}
              maxLength={500}
              required
              placeholder="Tiivistelmän teksti"
              defaultValue={infoBoxText}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Peruuta
            </button>
            <button type="submit" className="btn-submit">
              Tallenna
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
