import React from 'react';

export function Fab({ onAdd }) {
  return (
    <div className="fab-container">
      <button
        type="button"
        className="fab-btn"
        id="fab-add"
        aria-label="Lisää viesti"
        onClick={onAdd}
      >
        +
      </button>
    </div>
  );
}
