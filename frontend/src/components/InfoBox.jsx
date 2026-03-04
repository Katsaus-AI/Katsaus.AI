import React, { useState } from 'react';
import { escapeHtml } from '../utils';

export function InfoBox({ text, onEdit }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`info-box ${isExpanded ? 'expanded' : ''}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="info-box-icon">ℹ️</div>
      <div className="info-box-text">{escapeHtml(text)}</div>
      <button
        type="button"
        className="info-box-edit-btn"
        aria-label="Muokkaa tiivistelmää"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        ✏️
      </button>
    </div>
  );
}
