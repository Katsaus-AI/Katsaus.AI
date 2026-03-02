import React from 'react';

export function MessageModal({
  isOpen,
  editingMessage,
  editingId,
  onClose,
  onSubmit,
  defaultCategory,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal"
      id="message-modal"
      style={{ display: 'flex' }}
      onClick={(e) => e.target.id === 'message-modal' && onClose()}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            {editingMessage ? 'Muokkaa viestiä' : 'Lisää viesti'}
          </h2>
          <button type="button" className="modal-close" aria-label="Sulje" onClick={onClose}>
            &times;
          </button>
        </div>
        <form key={editingId ?? 'new'} id="message-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="message-title">OTSIKKO</label>
            <input
              id="message-title"
              name="messageTitle"
              type="text"
              maxLength={100}
              required
              placeholder="Viestin otsikko"
              defaultValue={editingMessage?.title}
            />
          </div>
          <div className="form-group">
            <label htmlFor="message-content">Sisältö</label>
            <textarea
              id="message-content"
              name="messageContent"
              rows={4}
              maxLength={500}
              required
              placeholder="Viestin sisältö"
              defaultValue={editingMessage?.content}
            />
          </div>
          <div className="form-group">
            <label htmlFor="message-category">Kategoria</label>
            <select
              id="message-category"
              name="messageCategory"
              defaultValue={editingMessage?.category || defaultCategory || 'uutisia'}
            >
              <option value="uutisia">Uutisia</option>
              <option value="tutkimus">Tutkimus</option>
              <option value="yritysyhteistyö">Yritysyhteistyö</option>
              <option value="opintohallinto">Opintohallinto</option>
              <option value="hr">HR</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="message-deadline">Määräaika (valinnainen)</label>
            <input
              id="message-deadline"
              name="messageDeadline"
              type="date"
              defaultValue={editingMessage?.deadline || ''}
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
